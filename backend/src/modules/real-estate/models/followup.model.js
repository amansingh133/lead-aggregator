import mongoose from "mongoose";
import { FOLLOWUP_TYPE_VALUES } from "../../../utils/constants.js";

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    prevFollowUpDate: { type: Date, required: true },
    nextFollowUpDate: { type: Date, required: true },
    numberOfClients: { type: Number, min: 1, default: 1 },
    type: { type: String, enum: FOLLOWUP_TYPE_VALUES, required: true },
    remarks: { type: String, trim: true, default: "" },
    // Only set when this follow-up moves the lead to/through Visit Planned,
    // Visit Done, or Revisit — the scheduled or actual visit date.
    visitDate: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

followUpSchema.index({ lead: 1, createdAt: -1 });

export const FollowUp = mongoose.model("FollowUp", followUpSchema);
