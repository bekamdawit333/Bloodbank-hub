const { mainDb } = require('../config/prisma');
const { sendSMS } = require('../shared/services/sms.service');

const DAY_MS = 24 * 60 * 60 * 1000;
const ELIGIBILITY_DAYS = 90;

// Sends an SMS reminder to donors whose last donation is ELIGIBILITY_DAYS old.
// Deduplicated per sample via sentSmsLog, so each donation triggers one reminder.
async function runDonationReminders() {
  try {
    console.log('[Job] Running 3-month donation reminders check...');
    const cutoff = new Date(Date.now() - ELIGIBILITY_DAYS * DAY_MS);

    const donors = await mainDb.donor.findMany({
      where: { last_donation_date: { lte: cutoff } },
    });

    for (const donor of donors) {
      const lastSample = await mainDb.bloodSample.findFirst({
        where: { fayda_id: donor.fayda_id },
        orderBy: { collected_at: 'desc' },
      });
      if (!lastSample) continue;

      const existingReminderLog = await mainDb.sentSmsLog.findUnique({
        where: {
          blood_sample_id_message_type: {
            blood_sample_id: lastSample.id,
            message_type: 'reminder',
          },
        },
      });
      if (existingReminderLog) continue;

      await sendSMS(
        donor.phone,
        `Dear ${donor.name}, 3 months have passed since your last blood donation! You are now eligible to donate again. Please visit a collection station to save lives. - Blood Bank Hub`,
        lastSample.id,
        'reminder'
      );
      console.log(`[Job] Sent 3-month reminder SMS to ${donor.name}`);
    }
  } catch (err) {
    console.error('[Job Error] Donation reminders failed:', err.message);
  }
}

function startDonationReminders() {
  setTimeout(runDonationReminders, 5000);
  setInterval(runDonationReminders, DAY_MS);
}

module.exports = { startDonationReminders };
