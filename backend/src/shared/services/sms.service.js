const { mainDb } = require('../../config/prisma');

// Low-level provider call: normalize Ethiopian phone formats and deliver.
// Throws on provider failure so callers can decide how to handle it.
async function deliverSms(phone, message) {
  const apiKey = process.env.SMS_ETHIOPIA_KEY;
  const response = await fetch('https://smsethiopia.com/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'KEY': apiKey,
    },
    body: JSON.stringify({
      msisdn: phone.replace('+', '').replace(/^0/, '251'),
      text: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} response: ${errorText}`);
  }

  return response.json();
}

function isSmsMocked() {
  const apiKey = process.env.SMS_ETHIOPIA_KEY;
  return !apiKey || apiKey === 'mock-key';
}

// Sends a sample-scoped SMS with duplicate protection and queue fallback.
async function sendSMS(phone, message, sampleId, type) {
  try {
    if (sampleId) {
      const checkLog = await mainDb.sentSmsLog.findUnique({
        where: {
          blood_sample_id_message_type: {
            blood_sample_id: sampleId,
            message_type: type,
          },
        },
      });
      if (checkLog) {
        console.log(`[SMS] Blocked duplicate SMS of type '${type}' for sample ${sampleId}`);
        return { success: false, reason: 'Duplicate prevented' };
      }
    }

    if (isSmsMocked()) {
      console.log(`[SMS MOCK] phone=${phone} type=${type} message="${message}"`);
      if (sampleId) {
        await mainDb.sentSmsLog.create({
          data: { phone, blood_sample_id: sampleId, message_type: type },
        });
      }
      return { success: true, mock: true };
    }

    const data = await deliverSms(phone, message);
    console.log('[SMSEthiopia Response]:', data);

    if (sampleId) {
      await mainDb.sentSmsLog.create({
        data: { phone, blood_sample_id: sampleId, message_type: type },
      });
    }

    return { success: true };
  } catch (err) {
    console.error('[SMS Send Error]:', err.message);

    // Enqueue for the retry worker
    try {
      await mainDb.smsQueue.create({
        data: { phone, message, status: 'failed', last_error: err.message },
      });
      console.log(`[SMS Queue] Enqueued failed SMS to ${phone} for later retry.`);
    } catch (queueErr) {
      console.error('[SMS Queue DB Save Error]:', queueErr.message);
    }

    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS, deliverSms, isSmsMocked };
