/**
 * Dev-only recovery tool: manually (re)fetches ONE Meta Lead Ad submission
 * by its leadgen_id and ingests it as a Main Project Lead, using the exact
 * same code path the `leadgen` webhook calls
 * (MetaLeadIngestService.ingestFromWebhook). Useful when a webhook delivery
 * was missed - there is no way to "replay" a webhook.
 *
 * Deliberately NOT exposed as an HTTP route - running it requires shell
 * access to this backend. Do not wire this up to a route/controller.
 *
 * Run with: npm run fetch-meta-lead -- <leadgenId> <pageId>
 * (<pageId> picks which connected ad account's token to use.)
 */
import mongoose from 'mongoose';
import { connectDB } from '../../../config/db.js';
import MetaConnectionService from '../services/MetaConnectionService.js';
import MetaLeadIngestService from '../services/MetaLeadIngestService.js';

const [leadgenId, pageId] = process.argv.slice(2);

const run = async () => {
  if (!leadgenId || !pageId) {
    console.error('Usage: npm run fetch-meta-lead -- <leadgenId> <pageId>');
    process.exit(1);
  }

  await connectDB();

  const connection = await MetaConnectionService.findConnectionForPage(pageId);
  if (!connection) {
    console.error(`❌ No Meta connection found for page ${pageId}. Connect one from the app first.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const { created } = await MetaLeadIngestService.ingestFromWebhook(
    leadgenId,
    connection,
  );
  console.log(
    created
      ? `✅ Lead saved (leadgenId=${leadgenId})`
      : `ℹ️  No new lead - this leadgenId was already captured (leadgenId=${leadgenId})`,
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
