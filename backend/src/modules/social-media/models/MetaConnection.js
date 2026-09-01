import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One connected Facebook Page for Lead Ads. An organisation can have
 * several (one per Page, across one or more Facebook accounts). Keyed by
 * `pageId` - re-connecting the same Page refreshes its tokens in place.
 *
 * Created through the Facebook Login (OAuth) flow: the person authorises
 * our app, we store the long-lived Page access token (for webhook lead
 * retrieval + subscribing the Page to our webhook) and the long-lived
 * user access token (for `ads_read` campaign browsing / ad discovery).
 *
 * Both tokens are stored ENCRYPTED (AES-256-GCM, see utils/crypto.js) and
 * `select: false`, so they never leave the server: decrypted only
 * transiently, in-process, for a Meta Graph API call.
 *
 * Any Admin / Super Admin can add or update a connection; only a Super
 * Admin can remove one (enforced in the route).
 */
const metaConnectionSchema = new Schema(
  {
    pageId: { type: String, required: true, unique: true },
    pageName: { type: String, default: null },
    // Long-lived Page access token.
    pageAccessTokenEncrypted: { type: String, required: true, select: false },
    // Long-lived user access token from the same OAuth grant.
    userAccessTokenEncrypted: { type: String, select: false, default: null },
    userTokenExpiresAt: { type: Date, default: null },
    grantedScopes: { type: [String], default: [] },
    // Ad accounts discovered for this person at connect time - for campaign browsing.
    adAccounts: {
      type: [{ id: String, name: String, currency: String }],
      default: [],
    },
    // Whether POST /{pageId}/subscribed_apps (field: leadgen) succeeded, i.e.
    // real-time lead delivery is active for this Page.
    webhookSubscribed: { type: Boolean, default: false },
    // The user who most recently connected/updated this connection. Used as
    // `createdBy` on every Lead ingested through it.
    connectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    lastValidatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("MetaConnection", metaConnectionSchema);
