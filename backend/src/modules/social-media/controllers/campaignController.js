import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import MetaConnectionService from "../services/MetaConnectionService.js";
import MetaAdsService from "../services/MetaAdsService.js";
import MetaLeadIngestService from "../services/MetaLeadIngestService.js";
import logger from "../utils/logger.js";

// GET /social/campaigns  [?connectionId=<id>]
// Lead Ads campaigns live from Meta. With no connectionId, fans out across
// every connected Page and each of its discovered ad accounts, tagging each
// campaign with the connection + Page + ad account it came from. A
// connection whose user token is missing/expired, or an ad account that
// errors, is skipped with a server-side warning, not a hard error.
export const listCampaigns = asyncHandler(async (req, res) => {
  const { connectionId } = req.query;

  const connections = connectionId
    ? [await MetaConnectionService.requireConnectionById(connectionId)]
    : await MetaConnectionService.getAllWithTokens();

  const perConnection = await Promise.all(
    connections.map(async (conn) => {
      const userToken = MetaConnectionService.resolveUserToken(conn);
      if (!userToken) {
        logger.warn(
          `Campaign list: connection ${conn._id} (page ${conn.pageId}) has no ads token - reconnect needed`,
        );
        return [];
      }
      const adAccounts = conn.adAccounts || [];
      const perAccount = await Promise.all(
        adAccounts.map(async (acct) => {
          try {
            const raw = await MetaAdsService.fetchCampaigns(acct.id, userToken);
            return raw.map((c) => ({
              id: c.id,
              name: c.name || null,
              objective: c.objective || null,
              status: c.status || null,
              effectiveStatus: c.effective_status || null,
              connectionId: conn._id,
              pageName: conn.pageName || conn.pageId,
              adAccountName: acct.name || acct.id,
            }));
          } catch (err) {
            logger.warn(
              `Campaign list: connection ${conn._id} ad account ${acct.id} failed: ${err.message}`,
            );
            return [];
          }
        }),
      );
      return perAccount.flat();
    }),
  );

  return sendSuccess(res, 200, "Campaigns fetched", perConnection.flat());
});

// Shared: load a connection and its ads_read user token, or fail cleanly.
async function requireAdsToken(connectionId, action) {
  const conn = await MetaConnectionService.requireConnectionById(connectionId);
  const userToken = MetaConnectionService.resolveUserToken(conn);
  if (!userToken) {
    throw ApiError.badRequest(
      `Ads access for this Page has expired. Reconnect it to ${action}.`,
      "ADS_TOKEN_MISSING",
    );
  }
  return userToken;
}

// GET /social/campaigns/:campaignId/adsets?connectionId=<id>
// Live ad sets in one campaign, for the Campaigns page browse tree.
export const listAdSets = asyncHandler(async (req, res) => {
  const userToken = await requireAdsToken(req.query.connectionId, "browse ad sets");
  const raw = await MetaAdsService.fetchAdSetsForCampaign(
    req.params.campaignId,
    userToken,
  );
  const adSets = raw.map((a) => ({
    id: a.id,
    name: a.name || null,
    status: a.status || null,
    effectiveStatus: a.effective_status || null,
    optimizationGoal: a.optimization_goal || null,
  }));
  return sendSuccess(res, 200, "Ad sets fetched", adSets);
});

// GET /social/campaigns/adsets/:adsetId/ads?connectionId=<id>
// Live ads in one ad set, for the Campaigns page browse tree.
export const listAds = asyncHandler(async (req, res) => {
  const userToken = await requireAdsToken(req.query.connectionId, "browse ads");
  const raw = await MetaAdsService.fetchAdsForAdSet(req.params.adsetId, userToken);
  const ads = raw.map((a) => ({
    id: a.id,
    name: a.name || null,
    status: a.status || null,
    effectiveStatus: a.effective_status || null,
  }));
  return sendSuccess(res, 200, "Ads fetched", ads);
});

// POST /social/campaigns/:campaignId/sync-leads   { connectionId }
// Runs the reconciliation pull for one campaign using the given
// connection's token, and ingests any new submissions into the unified
// Lead system. Returns a summary only - leads are read via
// GET /api/v1/leads?origin=social&platform=facebook.
export const syncCampaignLeads = asyncHandler(async (req, res) => {
  const { connectionId } = req.body;
  if (!connectionId) {
    throw ApiError.badRequest("connectionId is required.", "CONNECTION_ID_REQUIRED");
  }
  const conn = await MetaConnectionService.requireConnectionById(connectionId);

  const result = await MetaLeadIngestService.syncCampaign(
    req.params.campaignId,
    conn,
  );

  return sendSuccess(res, 200, "Lead sync complete", {
    scanned: result.scanned,
    created: result.created,
  });
});
