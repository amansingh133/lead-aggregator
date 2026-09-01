import { graphGet } from "./metaGraphClient.js";

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "objective",
  "status",
  "effective_status",
].join(",");

// Minimal ad fields - just enough to discover which ads belong to a
// campaign so their /leads edge can be queried.
const AD_FIELDS = ["id", "name", "campaign_id", "adset_id"].join(",");

// Fields for the read-only "browse the campaign > ad set > ad tree" view on
// the Campaigns page (not the lead-ingest path).
const ADSET_BROWSE_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "optimization_goal",
].join(",");
const AD_BROWSE_FIELDS = ["id", "name", "status", "effective_status"].join(",");

// Required fields per Meta's Lead Ads Retrieval API. Do not add fields Meta
// does not document for this node.
const LEAD_FIELDS = [
  "id",
  "created_time",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "field_data",
].join(",");

/**
 * All read-only Meta Graph API calls for the Facebook Lead Ads integration.
 * Every call needs a User or System User access token with `ads_read`
 * (browse campaigns/ads) and `leads_retrieval` (read Instant Form answers).
 */
export default class MetaAdsService {
  static async fetchCampaigns(adAccountId, accessToken) {
    const data = await graphGet(
      `${adAccountId}/campaigns`,
      { fields: CAMPAIGN_FIELDS, params: { limit: 100 }, accessToken },
      "Fetching campaigns failed",
    );
    return data?.data ?? [];
  }

  /**
   * Ads belonging to one campaign, via GET /{campaign-id}/ads - a
   * documented Graph API edge. Used only to discover which ads to then
   * query for leads.
   */
  static async fetchAdsForCampaign(campaignId, accessToken) {
    const data = await graphGet(
      `${campaignId}/ads`,
      { fields: AD_FIELDS, params: { limit: 200 }, accessToken },
      "Fetching ads for campaign failed",
    );
    return data?.data ?? [];
  }

  /** Ad sets in one campaign - for the Campaigns page browse tree. */
  static async fetchAdSetsForCampaign(campaignId, accessToken) {
    const data = await graphGet(
      `${campaignId}/adsets`,
      { fields: ADSET_BROWSE_FIELDS, params: { limit: 200 }, accessToken },
      "Fetching ad sets for campaign failed",
    );
    return data?.data ?? [];
  }

  /** Ads in one ad set - for the Campaigns page browse tree. */
  static async fetchAdsForAdSet(adSetId, accessToken) {
    const data = await graphGet(
      `${adSetId}/ads`,
      { fields: AD_BROWSE_FIELDS, params: { limit: 200 }, accessToken },
      "Fetching ads for ad set failed",
    );
    return data?.data ?? [];
  }

  static async fetchLeadsForAd(adId, accessToken, adLabel) {
    const data = await graphGet(
      `${adId}/leads`,
      { fields: LEAD_FIELDS, params: { limit: 100 }, accessToken },
      `Fetching leads for ad "${adLabel || adId}" failed`,
    );
    return data?.data ?? [];
  }

  /**
   * The full details of ONE Lead Ads submission. A `leadgen` webhook event
   * only carries a leadgen_id - this is the follow-up call that turns it
   * into name/email/phone/form answers.
   */
  static async fetchLeadById(leadgenId, accessToken) {
    return graphGet(
      leadgenId,
      { fields: LEAD_FIELDS, accessToken },
      "Fetching lead details failed",
    );
  }
}
