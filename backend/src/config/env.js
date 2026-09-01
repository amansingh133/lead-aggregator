import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET", "TOKEN_ENCRYPTION_KEY"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `❌ Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

// Fail fast with a clear message rather than only discovering an invalid
// key the first time something tries to encrypt/decrypt the Meta access
// token (see utils/crypto.js).
if (process.env.TOKEN_ENCRYPTION_KEY.length !== 64) {
  // eslint-disable-next-line no-console
  console.error(
    "❌ TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) - generate one with: openssl rand -hex 32",
  );
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 6000,
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  mongodbUri: process.env.MONGODB_URI,

  // Server-side only. Encrypts the Meta access token at rest (utils/crypto.js).
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  otp: {
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 10,
    length: Number(process.env.OTP_LENGTH) || 6,
  },

  emailjs: {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  },

  firebase: {
    enabled: process.env.FCM_ENABLED === "true",
    // serviceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH,
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  },

  reminder: {
    // How many minutes before a follow-up/visit to start reminding
    leadMinutes: Number(process.env.REMINDER_LEAD_MINUTES) || 30,
    // How often (minutes) the cron job checks for due reminders
    cronIntervalMinutes:
      Number(process.env.REMINDER_CRON_INTERVAL_MINUTES) || 5,
  },

  corsOrigin: process.env.CORS_ORIGIN || "*",

  // ── Facebook Lead Ads integration (Meta Graph API) ──────────
  facebook: {
    // App id + secret of the ONE Meta Developer App. appId is used to build
    // the Facebook Login OAuth URL and inspect tokens; appSecret also
    // verifies the HMAC signature on webhook deliveries. Never sent to the
    // client, never logged.
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    graphVersion: process.env.FACEBOOK_GRAPH_API_VERSION || "v26.0",
    // Arbitrary string YOU choose - entered in both .env and the Meta App
    // Dashboard's Webhooks setup screen, so Meta can prove it's really them
    // calling the webhook verification endpoint.
    webhookVerifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
    // Where Facebook sends the user back after the login dialog - the
    // frontend callback route, e.g. https://app.example.com/social/meta/callback
    oauthRedirectUri: process.env.FACEBOOK_OAUTH_REDIRECT_URI,
    // Optional "Facebook Login for Business" configuration id. If set it
    // replaces the raw scope list in the OAuth URL.
    loginConfigId: process.env.FACEBOOK_LOGIN_CONFIG_ID || null,
    // Fallback scope list when no loginConfigId is configured.
    oauthScopes:
      process.env.FACEBOOK_OAUTH_SCOPES ||
      "pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval,ads_read",
  },
};
