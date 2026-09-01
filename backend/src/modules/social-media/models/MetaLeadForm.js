import mongoose from "mongoose";

const { Schema } = mongoose;

// Cached Meta Lead Ads form definitions. Lets an ingested lead show the
// advertiser's real question wording ("Which BHK are you looking for?")
// instead of the raw field key. Refreshed lazily - see MetaLeadFormService.
const questionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, default: null },
    type: { type: String, default: null },
  },
  { _id: false },
);

const metaLeadFormSchema = new Schema(
  {
    formId: { type: String, required: true, unique: true },
    name: { type: String, default: null },
    questions: { type: [questionSchema], default: [] },
    // When the definition was last read from Meta - drives the refresh TTL.
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("MetaLeadForm", metaLeadFormSchema);
