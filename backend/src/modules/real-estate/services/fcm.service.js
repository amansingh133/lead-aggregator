import { admin, isFirebaseReady } from '../../../config/firebase.js';

/**
 * Sends a push notification to one or more device tokens.
 * No-ops (and logs) if Firebase Admin was never initialized, so the rest
 * of the app (and the reminder cron job) keeps working without FCM set up.
 */
export const sendPushNotification = async ({ tokens, title, body, data = {} }) => {
  if (!isFirebaseReady()) {
    // eslint-disable-next-line no-console
    console.log(`🔕 [FCM DISABLED] Would have sent: "${title}" - ${body}`);
    return { sent: false };
  }

  const validTokens = (tokens || []).filter(Boolean);
  if (validTokens.length === 0) return { sent: false, reason: 'NO_DEVICE_TOKENS' };

  const message = {
    tokens: validTokens,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return { sent: true, successCount: response.successCount, failureCount: response.failureCount };
};
