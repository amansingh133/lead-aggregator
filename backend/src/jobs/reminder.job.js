import cron from "node-cron";
import { Lead } from "../modules/real-estate/models/lead.model.js";
import { sendPushNotification } from "../modules/real-estate/services/fcm.service.js";
import { env } from "../config/env.js";
import { LEAD_STATUS } from "../utils/constants.js";

// Statuses that are "closed" — no more reminders should ever fire for them.
const EXCLUDED_STATUSES = [
  LEAD_STATUS.BROKER,
  LEAD_STATUS.CONVERTED,
  LEAD_STATUS.DROPPED,
];

const runReminderSweep = async () => {
  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + env.reminder.leadMinutes * 60 * 1000,
  );
  const debounceThreshold = new Date(
    now.getTime() - env.reminder.cronIntervalMinutes * 60 * 1000,
  );

  const dueLeads = await Lead.find({
    status: { $nin: EXCLUDED_STATUSES },
    $or: [
      { lastReminderSentAt: null },
      { lastReminderSentAt: { $lte: debounceThreshold } },
    ],
    $and: [
      {
        $or: [
          {
            status: LEAD_STATUS.VISIT_PLANNED,
            visitDate: { $gte: now, $lte: windowEnd },
          },
          {
            status: { $ne: LEAD_STATUS.VISIT_PLANNED },
            nextFollowUpDate: { $gte: now, $lte: windowEnd },
          },
        ],
      },
    ],
  }).populate("assignedTo", "fcmTokens name");

  for (const lead of dueLeads) {
    const isVisit = lead.status === LEAD_STATUS.VISIT_PLANNED;
    const dueDate = isVisit ? lead.visitDate : lead.nextFollowUpDate;
    const title = isVisit ? "Upcoming site visit" : "Upcoming follow-up";
    const body = `${lead.name} - ${isVisit ? "visit" : "follow-up"} scheduled at ${new Date(dueDate).toLocaleString()}`;

    try {
      await sendPushNotification({
        tokens: lead.assignedTo?.fcmTokens || [],
        title,
        body,
        data: {
          leadId: lead._id.toString(),
          type: isVisit ? "VISIT" : "FOLLOWUP",
        },
      });
    } finally {
      lead.lastReminderSentAt = now;
      // eslint-disable-next-line no-await-in-loop
      await lead.save();
    }
  }

  return dueLeads.length;
};

export const startReminderJob = () => {
  const cronExpression = `*/${env.reminder.cronIntervalMinutes} * * * *`;
  cron.schedule(cronExpression, async () => {
    try {
      const count = await runReminderSweep();
      if (count > 0) {
        // eslint-disable-next-line no-console
        console.log(`🔔 Reminder job: sent ${count} reminder(s)`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Reminder job failed:", error.message);
    }
  });
  // eslint-disable-next-line no-console
  console.log(
    `⏰ Reminder cron job scheduled (every ${env.reminder.cronIntervalMinutes} min)`,
  );
};

export { runReminderSweep };
