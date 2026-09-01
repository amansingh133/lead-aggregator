import crypto from "crypto";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import MetaConnectionService from "../services/MetaConnectionService.js";
import MetaLeadIngestService from "../services/MetaLeadIngestService.js";
import { env } from "../../../config/env.js";

/**
 * Facebook Lead Ads webhook, in two parts:
 *
 * 1. GET  - the one-time handshake Meta sends when the callback URL is
 *    registered in the App Dashboard. Echo back `hub.challenge` ONLY if
 *    `hub.verify_token` matches FACEBOOK_WEBHOOK_VERIFY_TOKEN (a secret
 *    configured on both sides, not something an end user enters).
 *
 * 2. POST - the `leadgen` events, sent whenever someone submits an Instant
 *    Form. Every request's HMAC-SHA256 signature is verified against
 *    FACEBOOK_APP_SECRET (over the exact raw bytes Meta sent) before
 *    anything is processed. The owning Main Project user is resolved by
 *    matching the event's page_id against a stored MetaConnection.
 */

export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token &&
    env.facebook.webhookVerifyToken &&
    token === env.facebook.webhookVerifyToken
  ) {
    logger.info("Facebook webhook verified successfully");
    return res.status(200).send(challenge);
  }

  logger.warn("Facebook webhook verification failed - token mismatch");
  return res.sendStatus(403);
};

/**
 * Recomputes the HMAC-SHA256 signature Meta attaches in the
 * `x-hub-signature-256` header, over the raw request body, using the App
 * Secret. timingSafeEqual throws if the two buffers differ in length, so
 * the comparison is wrapped.
 */
function isValidSignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !env.facebook.appSecret || !req.rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", env.facebook.appSecret)
    .update(req.rawBody)
    .digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export const receiveWebhookEvent = asyncHandler(async (req, res) => {
  if (!isValidSignature(req)) {
    logger.warn("Facebook webhook signature verification failed");
    return res.sendStatus(403);
  }

  // Always ack immediately - Meta expects a fast 200 and retries on timeout.
  res.sendStatus(200);

  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      if (change.field !== "leadgen") continue;

      const leadgenId = change.value?.leadgen_id;
      const pageId = change.value?.page_id || entry.id;
      if (!leadgenId) continue;

      // Pick the connection whose Page this event belongs to - that gives
      // us the right token to fetch the lead with.
      // eslint-disable-next-line no-await-in-loop
      const connection = await MetaConnectionService.findConnectionForPage(pageId);
      if (!connection) {
        logger.warn(
          `Skipped webhook lead ${leadgenId}: no connected Meta account for page ${pageId}`,
        );
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await MetaLeadIngestService.ingestFromWebhook(leadgenId, connection).catch(
        (err) =>
          logger.error(
            `Failed to capture webhook lead ${leadgenId}: ${err.message}`,
          ),
      );
    }
  }

  return undefined;
});
