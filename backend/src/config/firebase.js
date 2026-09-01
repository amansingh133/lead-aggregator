import admin from "firebase-admin";
import { env } from "./env.js";

let initialized = false;

/**
 * Initializes Firebase Admin only if FCM is enabled and a service account
 * file is present. The app must keep working (without push notifications)
 * even if Firebase is not configured yet.
 */
export const initFirebase = () => {
  if (!env.firebase.enabled) {
    // eslint-disable-next-line no-console
    console.log("ℹ️  FCM push notifications are disabled (FCM_ENABLED=false)");
    return;
  }

  if (!env.firebase.serviceAccountBase64) {
    console.warn(
      "⚠️  FCM_ENABLED=true but FIREBASE_SERVICE_ACCOUNT_BASE64 was not found. Push notifications will be skipped.",
    );
    return;
  }

  // if (!initialized) {
  //   const serviceAccount = JSON.parse(
  //     fs.readFileSync(env.firebase.serviceAccountPath, "utf-8"),
  //   );
  //   admin.initializeApp({
  //     credential: admin.credential.cert(serviceAccount),
  //   });
  //   initialized = true;
  //   // eslint-disable-next-line no-console
  //   console.log("✅ Firebase Admin (FCM) initialized");
  // }

  if (!initialized) {
    try {
      // Base64 string decoded to JSON String
      const decodedJson = Buffer.from(
        env.firebase.serviceAccountBase64,
        "base64",
      ).toString("utf-8");
      const serviceAccount = JSON.parse(decodedJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      initialized = true;
      console.log(
        "✅ Firebase Admin (FCM) initialized successfully via Base64 Env!",
      );
    } catch (error) {
      console.error(
        "❌ Failed to parse or initialize Firebase Service Account:",
        error.message,
      );
    }
  }
};

export const isFirebaseReady = () => initialized;
export { admin };
