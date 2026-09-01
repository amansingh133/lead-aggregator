import jwt from "jsonwebtoken";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { env } from "../../../config/env.js";
import { encrypt, decrypt } from "../../../utils/crypto.js";
import MetaOAuthService from "../services/MetaOAuthService.js";
import MetaConnectionService from "../services/MetaConnectionService.js";
import MetaOAuthSession from "../models/MetaOAuthSession.js";

const STATE_PURPOSE = "meta_oauth";

// GET /social/meta-connection/oauth/start
// Returns the Facebook login URL. `state` is a short-lived signed token
// bound to this user, verified on the way back to stop CSRF / replay.
export const start = asyncHandler(async (req, res) => {
  const state = jwt.sign(
    { sub: req.user._id.toString(), t: STATE_PURPOSE },
    env.jwt.secret,
    { expiresIn: "10m" },
  );
  const authUrl = MetaOAuthService.buildAuthUrl({ state });
  return sendSuccess(res, 200, "Facebook login URL", { authUrl });
});

// POST /social/meta-connection/oauth/exchange   { code, state }
// Swaps the code for tokens, lists the person's Pages + ad accounts, and
// stashes the tokens in a short-lived server-side session. Returns only the
// Page/ad-account names for the picker - never a token.
export const exchange = asyncHandler(async (req, res) => {
  const { code, state } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(state, env.jwt.secret);
  } catch {
    throw ApiError.badRequest(
      "Your Facebook sign-in link has expired. Please try again.",
      "OAUTH_STATE_INVALID",
    );
  }
  if (decoded.t !== STATE_PURPOSE || decoded.sub !== req.user._id.toString()) {
    throw ApiError.badRequest("Invalid Facebook sign-in state.", "OAUTH_STATE_INVALID");
  }

  const shortToken = await MetaOAuthService.exchangeCode(code);
  const { token: userToken, expiresIn } =
    await MetaOAuthService.toLongLivedUserToken(shortToken);
  const info = await MetaOAuthService.inspectToken(userToken);

  const pages = await MetaOAuthService.listPages(userToken);
  if (pages.length === 0) {
    throw ApiError.badRequest(
      "No Facebook Pages found for this account. You must be an admin of at least one Page.",
      "NO_PAGES",
    );
  }
  const adAccounts = await MetaOAuthService.listAdAccounts(userToken);

  const userTokenExpiresAt =
    info.expiresAt ||
    (expiresIn ? new Date(Date.now() + expiresIn * 1000) : null);

  const session = await MetaOAuthSession.create({
    owner: req.user._id,
    userAccessTokenEncrypted: encrypt(userToken),
    userTokenExpiresAt,
    grantedScopes: info.scopes,
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      accessTokenEncrypted: encrypt(p.accessToken),
      tasks: p.tasks,
    })),
    adAccounts,
  });

  return sendSuccess(res, 200, "Facebook account authorised", {
    sessionId: session._id,
    pages: pages.map((p) => ({ id: p.id, name: p.name })),
    adAccounts,
    grantedScopes: info.scopes,
  });
});

// POST /social/meta-connection   { sessionId, pageIds: [] }
// Finalises the connection for the chosen Pages: subscribes each to our
// `leadgen` webhook and stores an encrypted MetaConnection row.
export const finalize = asyncHandler(async (req, res) => {
  const { sessionId, pageIds } = req.body;

  const session = await MetaOAuthSession.findOne({
    _id: sessionId,
    owner: req.user._id,
  });
  if (!session) {
    throw ApiError.notFound(
      "Your Facebook sign-in has expired. Please connect again.",
      "OAUTH_SESSION_EXPIRED",
    );
  }

  const chosen = session.pages.filter((p) => pageIds.includes(p.id));
  if (chosen.length === 0) {
    throw ApiError.badRequest("Select at least one Page to connect.", "NO_PAGES_SELECTED");
  }

  const userToken = decrypt(session.userAccessTokenEncrypted);
  const connected = [];

  for (const page of chosen) {
    const pageToken = decrypt(page.accessTokenEncrypted);
    let webhookSubscribed = false;
    try {
      // eslint-disable-next-line no-await-in-loop
      webhookSubscribed = await MetaOAuthService.subscribePageToLeadgen(
        page.id,
        pageToken,
      );
    } catch {
      webhookSubscribed = false; // connection still created; user can reconnect
    }

    // eslint-disable-next-line no-await-in-loop
    await MetaConnectionService.upsertPageConnection({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: pageToken,
      userAccessToken: userToken,
      userTokenExpiresAt: session.userTokenExpiresAt,
      adAccounts: session.adAccounts,
      grantedScopes: session.grantedScopes,
      webhookSubscribed,
      connectedBy: req.user._id,
    });
    connected.push({ pageId: page.id, pageName: page.name, webhookSubscribed });
  }

  await MetaOAuthSession.deleteOne({ _id: session._id });

  return sendSuccess(res, 200, "Facebook Pages connected", { connected });
});
