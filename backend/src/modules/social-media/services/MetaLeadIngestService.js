import { Lead } from "../../real-estate/models/lead.model.js";
import MetaAdsService from "./MetaAdsService.js";
import MetaConnectionService from "./MetaConnectionService.js";
import MetaLeadFormService from "./MetaLeadFormService.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  LEAD_ORIGIN,
  LEAD_STATUS,
  SOCIAL_LEAD_CHANNEL,
  PLATFORMS,
} from "../../../utils/constants.js";
import logger from "../utils/logger.js";

// field_data `name` values Meta commonly sends on Instant Forms, mapped to
// the unified Lead's convenience columns.
const CONTACT_FIELD_ALIASES = {
  fullName: ["full_name"],
  email: ["email", "work_email"],
  phone: ["phone_number", "phone"],
};

const SOURCE_LABEL = "Facebook Lead Ad";

// Fallback label when Meta's form definition has no custom label for a key
// (e.g. "preferred_locality" -> "Preferred Locality").
function humanizeKey(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * THE single authoritative path from a Facebook Lead Ads submission to a
 * Main Project Lead. Both entry points (the real-time `leadgen` webhook and
 * the per-campaign reconciliation pull) funnel through #upsert, whose
 * filter matches the Lead model's partial unique index
 * ({ social.platform, social.channel, social.externalId } for origin
 * 'social'): a repeated delivery is a no-op, never a duplicate lead.
 */
export default class MetaLeadIngestService {
  static #extractContactFields(fieldData) {
    const result = { fullName: null, email: null, phone: null };
    (fieldData || []).forEach((field) => {
      const value = field?.values?.[0] ?? null;
      Object.entries(CONTACT_FIELD_ALIASES).forEach(([key, names]) => {
        if (names.includes(field?.name) && !result[key]) {
          result[key] = value;
        }
      });
    });
    return result;
  }

  /**
   * Maps one raw Meta lead (from fetchLeadById / fetchLeadsForAd) into a
   * unified Lead document. Only name/email/phone are known at capture time;
   * project/type/assignedTo start empty and are filled in by whoever an
   * Admin assigns the lead to - exactly like the pre-existing social-lead
   * lifecycle. `createdBy` records the owning user (server-determined).
   */
  static #mapToLeadDoc(raw, createdById, labelMap = {}) {
    // Keep every answer the person gave, in the form's own order, each tagged
    // with a human label (the advertiser's question text when we have the
    // form definition, otherwise a humanised key).
    const fieldData = (raw.field_data || []).map((f) => ({
      name: f.name,
      label: labelMap[f.name] || humanizeKey(f.name),
      values: Array.isArray(f.values) ? f.values : [],
    }));
    const contact = MetaLeadIngestService.#extractContactFields(fieldData);
    const capturedAt = raw.created_time ? new Date(raw.created_time) : new Date();

    return {
      origin: LEAD_ORIGIN.SOCIAL,
      name: contact.fullName || "",
      email: contact.email || null,
      mobileNumber: contact.phone || null,
      source: SOURCE_LABEL,
      status: LEAD_STATUS.NEW,
      // Both dated from the Instant Form submission (Meta's `created_time`),
      // not from when we happened to ingest it.
      addedDate: capturedAt,
      nextFollowUpDate: capturedAt,
      project: null,
      type: null,
      assignedTo: null,
      createdBy: createdById || null,
      social: {
        platform: PLATFORMS.FACEBOOK,
        channel: SOCIAL_LEAD_CHANNEL.LEAD_AD,
        externalId: raw.id,
        fieldData,
        formId: raw.form_id || null,
        campaignId: raw.campaign_id || null,
        campaignName: raw.campaign_name || null,
        adsetId: raw.adset_id || null,
        adsetName: raw.adset_name || null,
        adId: raw.ad_id || null,
        adName: raw.ad_name || null,
        raw,
      },
    };
  }

  /**
   * Idempotent insert. `$setOnInsert` means an existing lead (same Meta
   * leadgen id) is left completely untouched - re-processing a webhook or
   * re-running a sync never overwrites Admin edits.
   */
  static async #upsert(raw, createdById, labelMap = {}) {
    if (!raw?.id) return { created: false };
    const doc = MetaLeadIngestService.#mapToLeadDoc(raw, createdById, labelMap);
    const res = await Lead.updateOne(
      {
        origin: LEAD_ORIGIN.SOCIAL,
        "social.platform": doc.social.platform,
        "social.channel": doc.social.channel,
        "social.externalId": doc.social.externalId,
      },
      { $setOnInsert: doc },
      { upsert: true },
    );
    return { created: (res.upsertedCount || 0) > 0 };
  }

  /**
   * Called by the `leadgen` webhook. The webhook payload only carries a
   * leadgen_id; fetch the full lead with the owner's decrypted token, then
   * upsert.
   */
  static async ingestFromWebhook(leadgenId, connectionDoc) {
    // Reading a lead's field data needs `leads_retrieval` on the Page token.
    const pageToken = MetaConnectionService.resolvePageToken(connectionDoc);
    const raw = await MetaAdsService.fetchLeadById(leadgenId, pageToken);
    const labelMap = await MetaLeadFormService.getLabelMap(
      raw?.form_id,
      pageToken,
    );
    return MetaLeadIngestService.#upsert(
      raw,
      connectionDoc.connectedBy,
      labelMap,
    );
  }

  /**
   * Reconciliation pull for one campaign: discover the campaign's ads, read
   * each ad's /leads edge, upsert everything found. Best-effort - if the
   * live pull fails (e.g. `leads_retrieval` not yet Advanced-Access
   * approved) it is reported, not thrown, so the endpoint still returns
   * cleanly and the webhook path remains the source of truth.
   */
  static async syncCampaign(campaignId, connectionDoc) {
    // Discovering the campaign's ads needs `ads_read` (user token); reading
    // each ad's leads needs `leads_retrieval` (Page token).
    const userToken = MetaConnectionService.resolveUserToken(connectionDoc);
    if (!userToken) {
      throw ApiError.badRequest(
        "Reconnect this Facebook Page to enable campaign lead sync (ads permission missing or expired).",
        "ADS_TOKEN_MISSING",
      );
    }
    const pageToken = MetaConnectionService.resolvePageToken(connectionDoc);
    const ads = await MetaAdsService.fetchAdsForCampaign(campaignId, userToken);

    let scanned = 0;
    let created = 0;
    const errors = [];

    // One label-map lookup per distinct form across the whole sync (the
    // service also caches in Mongo, so repeats are cheap regardless).
    const formLabelMaps = new Map();
    const labelMapFor = async (formId) => {
      if (!formId) return {};
      if (!formLabelMaps.has(formId)) {
        formLabelMaps.set(
          formId,
          await MetaLeadFormService.getLabelMap(formId, pageToken),
        );
      }
      return formLabelMaps.get(formId);
    };

    for (const ad of ads) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const rawLeads = await MetaAdsService.fetchLeadsForAd(
          ad.id,
          pageToken,
          ad.name,
        );
        for (const raw of rawLeads) {
          scanned += 1;
          // eslint-disable-next-line no-await-in-loop
          const labelMap = await labelMapFor(raw.form_id);
          // eslint-disable-next-line no-await-in-loop
          const { created: didCreate } = await MetaLeadIngestService.#upsert(
            raw,
            connectionDoc.connectedBy,
            labelMap,
          );
          if (didCreate) created += 1;
        }
      } catch (err) {
        errors.push(err.message);
        logger.warn(
          `Lead sync: ad ${ad.id} in campaign ${campaignId} failed: ${err.message}`,
        );
      }
    }

    return { scanned, created, adCount: ads.length, partialErrors: errors.length };
  }
}
