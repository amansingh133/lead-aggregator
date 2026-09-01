import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Short-lived scratch record that holds the result of a Facebook Login
 * token exchange between the "exchange" step (server has the tokens + the
 * list of Pages) and the "finalize" step (the user picks which Pages to
 * connect). Keeping it server-side means access tokens are never sent to
 * the browser. Auto-expires after 15 minutes via the TTL index on
 * `createdAt`.
 */
const metaOAuthSessionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userAccessTokenEncrypted: { type: String, required: true },
    userTokenExpiresAt: { type: Date, default: null },
    grantedScopes: { type: [String], default: [] },
    pages: {
      type: [
        {
          id: String,
          name: String,
          accessTokenEncrypted: String,
          tasks: [String],
        },
      ],
      default: [],
    },
    adAccounts: {
      type: [{ id: String, name: String, currency: String }],
      default: [],
    },
    createdAt: { type: Date, default: Date.now, expires: 900 },
  },
  { versionKey: false },
);

export default mongoose.model("MetaOAuthSession", metaOAuthSessionSchema);
