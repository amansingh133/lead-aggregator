import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initFirebase } from "./config/firebase.js";
import { startReminderJob } from "./jobs/reminder.job.js";
import MetaConnection from "./modules/social-media/models/MetaConnection.js";

const start = async () => {
  await connectDB();

  // One-off: MetaConnection has been reshaped twice (singleton `key` ->
  // one row per ad account -> one row per Facebook Page). Drop the obsolete
  // unique indexes if a prior deploy created them so the current shape can
  // be stored. No-ops on a fresh database.
  await MetaConnection.collection.dropIndex("key_1").catch(() => {});
  await MetaConnection.collection.dropIndex("adAccountId_1").catch(() => {});

  initFirebase();
  startReminderJob();

  const server = app.listen(env.port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(
      `🚀 Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `   API base URL: http://localhost:${env.port}${env.apiPrefix}`,
    );
  });

  process.on("unhandledRejection", (err) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", err);
    server.close(() => process.exit(1));
  });
};

start();
