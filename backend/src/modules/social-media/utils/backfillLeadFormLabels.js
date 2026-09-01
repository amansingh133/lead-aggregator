/**
 * One-off migration for social-origin Leads captured before two fixes:
 *   1. `social.fieldData[].label` - the advertiser's question text (read from
 *      Meta's form definition, cached in MetaLeadForm). Only `label` is
 *      rewritten; `name` and `values` (the submitted data) are never touched.
 *   2. `addedDate` - should be the Instant Form submission time
 *      (`created_time` from Meta), not when we happened to ingest the lead.
 *
 * Safe to re-run. Run with:
 *   node src/modules/social-media/utils/backfillLeadFormLabels.js
 */
import mongoose from "mongoose";
import { connectDB } from "../../../config/db.js";
import { Lead } from "../../real-estate/models/lead.model.js";
import { LEAD_ORIGIN } from "../../../utils/constants.js";
import MetaConnectionService from "../services/MetaConnectionService.js";
import MetaLeadFormService from "../services/MetaLeadFormService.js";

function humanizeKey(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const run = async () => {
  await connectDB();

  const connections = await MetaConnectionService.getAllWithTokens();
  const pageTokens = [];
  for (const conn of connections) {
    try {
      pageTokens.push(MetaConnectionService.resolvePageToken(conn));
    } catch {
      /* connection without a usable Page token - skip */
    }
  }
  if (pageTokens.length === 0) {
    console.error("❌ No connected Pages with a usable token. Connect one first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const leads = await Lead.find({ origin: LEAD_ORIGIN.SOCIAL })
    .select("+social.raw social.formId social.fieldData addedDate nextFollowUpDate")
    .lean();

  console.log(`Found ${leads.length} social lead(s).`);

  // Resolve a label map per distinct form, trying each Page token until one works.
  const labelMapByForm = new Map();
  const resolveLabelMap = async (formId) => {
    if (!formId) return {};
    if (labelMapByForm.has(formId)) return labelMapByForm.get(formId);
    let map = {};
    for (const token of pageTokens) {
      // eslint-disable-next-line no-await-in-loop
      map = await MetaLeadFormService.getLabelMap(formId, token);
      if (Object.keys(map).length > 0) break;
    }
    labelMapByForm.set(formId, map);
    return map;
  };

  let labelsFixed = 0;
  let datesFixed = 0;
  for (const lead of leads) {
    const set = {};

    // 1. labels
    const current = lead.social.fieldData || [];
    if (current.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      const labelMap = await resolveLabelMap(lead.social.formId);
      const next = current.map((f) => ({
        name: f.name,
        label: labelMap[f.name] || f.label || humanizeKey(f.name),
        values: Array.isArray(f.values) ? f.values : [],
      }));
      if (next.some((f, i) => f.label !== current[i]?.label)) {
        set["social.fieldData"] = next;
        labelsFixed += 1;
      }
    }

    // 2. addedDate = submission time
    const submittedAt = lead.social?.raw?.created_time
      ? new Date(lead.social.raw.created_time)
      : lead.nextFollowUpDate
        ? new Date(lead.nextFollowUpDate)
        : null;
    if (
      submittedAt &&
      !Number.isNaN(submittedAt.getTime()) &&
      (!lead.addedDate ||
        Math.abs(new Date(lead.addedDate).getTime() - submittedAt.getTime()) > 1000)
    ) {
      set.addedDate = submittedAt;
      datesFixed += 1;
    }

    if (Object.keys(set).length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await Lead.updateOne({ _id: lead._id }, { $set: set }, { overwriteImmutable: true });
    }
  }

  console.log(
    `✅ Backfill complete - ${labelsFixed} lead(s) got form labels, ${datesFixed} got a corrected addedDate.`,
  );
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
