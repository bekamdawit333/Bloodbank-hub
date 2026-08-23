const { mainDb } = require('../config/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;
const SHELF_LIFE_DAYS = 35;
const EXPIRY_WARNING_DAYS = 5;

// Discard blood bags past their shelf life and broadcast a socket warning for
// bags that are EXPIRY_WARNING_DAYS away from expiring.
async function runBloodExpiryCheck(io) {
  try {
    console.log(`[Job] Running blood bag expiration check (${SHELF_LIFE_DAYS}-day limit)...`);

    const shelfLifeCutoff = new Date(Date.now() - SHELF_LIFE_DAYS * DAY_MS);
    const expired = await mainDb.bloodSample.updateMany({
      where: { collected_at: { lte: shelfLifeCutoff }, status: { notIn: ['discarded'] } },
      data: {
        status: 'discarded',
        health_notes: 'Automatically discarded: Expired (exceeded 35 days shelf life)',
      },
    });
    console.log(
      expired.count > 0
        ? `[Job] Automatically discarded ${expired.count} expired blood bags.`
        : '[Job] Expiration check completed. No expired bags found.'
    );

    const warningUpper = new Date(Date.now() - (SHELF_LIFE_DAYS - EXPIRY_WARNING_DAYS) * DAY_MS);
    const warningLower = new Date(warningUpper.getTime() - DAY_MS);

    const expiringBags = await mainDb.bloodSample.findMany({
      where: {
        collected_at: { lte: warningUpper, gte: warningLower },
        status: { in: ['collected', 'validated', 'pending_lab'] },
      },
    });

    for (const bag of expiringBags) {
      io.emit('expiry_warning', {
        id: bag.id,
        blood_type: bag.blood_type,
        message: `⚠️ [EXPIRY ALERT]: Blood bag ID ${bag.id.substring(0, 8)} (${bag.blood_type}) is expiring in ${EXPIRY_WARNING_DAYS} days! Please prioritize usage/dispatch of this bag beforehand.`,
      });
      console.log(`[Job] Broadcasted ${EXPIRY_WARNING_DAYS}-day expiry warning for bag ID: ${bag.id}`);
    }
  } catch (err) {
    console.error('[Job Error] Blood expiry check failed:', err.message);
  }
}

function startBloodExpiryCheck(io) {
  setTimeout(() => runBloodExpiryCheck(io), 8000);
  setInterval(() => runBloodExpiryCheck(io), DAY_MS);
}

module.exports = { startBloodExpiryCheck };
