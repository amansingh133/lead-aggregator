import MetaLeadForm from "../models/MetaLeadForm.js";
import { graphGet } from "./metaGraphClient.js";
import logger from "../utils/logger.js";

// How long a cached form definition is trusted before a refresh is attempted.
const FORM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Resolves a Lead Ads form's question definitions (field key -> human label),
 * cached in the MetaLeadForm collection. Labels are only a display nicety, so
 * every failure path degrades to "no labels" rather than throwing - lead
 * ingestion must never break because a form lookup failed.
 */
export default class MetaLeadFormService {
  static async #fetchAndCache(formId, pageToken) {
    const data = await graphGet(
      String(formId),
      { fields: "id,name,questions", accessToken: pageToken },
      "Fetching lead form definition failed",
    );
    // On a lead-gen form `questions` is a plain inline array; guard for the
    // nested-edge shape too just in case a future API version changes it.
    const rawQuestions = Array.isArray(data?.questions)
      ? data.questions
      : data?.questions?.data || [];
    const questions = rawQuestions.map((q) => ({
      key: q.key,
      label: q.label || null,
      type: q.type || null,
    }));
    return MetaLeadForm.findOneAndUpdate(
      { formId: String(formId) },
      {
        formId: String(formId),
        name: data?.name || null,
        questions,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  /** [{ key, label, type }] for a form - cached, best-effort. */
  static async getQuestions(formId, pageToken) {
    if (!formId) return [];
    const cached = await MetaLeadForm.findOne({ formId: String(formId) });
    const fresh =
      cached &&
      Date.now() - new Date(cached.fetchedAt).getTime() < FORM_CACHE_TTL_MS;
    if (fresh) return cached.questions;

    try {
      const doc = await MetaLeadFormService.#fetchAndCache(formId, pageToken);
      return doc.questions;
    } catch (err) {
      logger.warn(
        `Lead form ${formId} definition lookup failed: ${err.message}`,
      );
      return cached?.questions || []; // stale cache if present, else nothing
    }
  }

  /** { [fieldKey]: label } convenience map for a form. */
  static async getLabelMap(formId, pageToken) {
    const questions = await MetaLeadFormService.getQuestions(formId, pageToken);
    const map = {};
    questions.forEach((q) => {
      if (q.key && q.label) map[q.key] = q.label;
    });
    return map;
  }
}
