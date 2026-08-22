const { mainDb } = require('../config/prisma');
const { deliverSms, isSmsMocked } = require('../shared/services/sms.service');

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 30000;

// Retries SMS messages that failed delivery, up to MAX_RETRIES attempts each.
async function retryFailedSms() {
  try {
    const failed = await mainDb.smsQueue.findMany({
      where: { status: 'failed', retry_count: { lt: MAX_RETRIES } },
    });
    if (failed.length === 0) return;

    console.log(`[SMS Queue] Retrying ${failed.length} queued message(s)...`);

    for (const sms of failed) {
      try {
        if (isSmsMocked()) {
          await markSent(sms, sms.retry_count + 1);
          console.log(`[SMS Queue] Mock-delivered message ID: ${sms.id}`);
          continue;
        }

        await deliverSms(sms.phone, sms.message);
        await markSent(sms, sms.retry_count + 1);
        console.log(`[SMS Queue] Delivered message ID: ${sms.id}`);
      } catch (err) {
        console.error(`[SMS Queue] Retry failed for ID: ${sms.id}:`, err.message);
        await mainDb.smsQueue.update({
          where: { id: sms.id },
          data: { retry_count: sms.retry_count + 1, last_error: err.message },
        });
      }
    }
  } catch (err) {
    console.error('[SMS Queue Error]:', err.message);
  }
}

async function markSent(sms, nextRetryCount) {
  await mainDb.smsQueue.update({
    where: { id: sms.id },
    data: { status: 'sent', retry_count: nextRetryCount },
  });
}

function startSmsQueueWorker() {
  retryFailedSms();
  setInterval(retryFailedSms, POLL_INTERVAL_MS);
}

module.exports = { startSmsQueueWorker };
