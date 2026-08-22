const { startDonationReminders } = require('./donationReminders.job');
const { startBloodExpiryCheck } = require('./bloodExpiry.job');
const { startSmsQueueWorker } = require('./smsQueue.worker');

// Starts every background job. Called once after the server begins listening.
function startBackgroundJobs(io) {
  startDonationReminders();
  startBloodExpiryCheck(io);
  startSmsQueueWorker();
}

module.exports = { startBackgroundJobs };
