const { mainDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcryptjs');

async function getUsers(req, res) {
  try {
    // DB query goes here
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve system users' });
  }
}

    const users = await mainDb.user.findMany({
      where: {
        NOT: { role: 'admin' }
      }
    });
    res.json(users);

        const users = await mainDb.user.findMany({
      where: {
        NOT: { role: 'admin' }
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        entity_name: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid registration status option' });
  }
}
  try {
    const user = await mainDb.user.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: `User account status updated to ${status}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        entity_name: user.entity_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
      await logAction(
      req.user.id,
      `USER_REGISTRATION_${status.toUpperCase()}`,
      `Updated registration status for user ${user.email} (${user.role}) to: ${status}.`
    );
    async function getAdminAnalytics(req, res) {
  try {
    // Query logic goes here
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve administrative analytics' });
  }
}
    const requests = await mainDb.hospitalRequest.findMany({
      include: { hospital: { select: { entity_name: true } } }
    });

    const hospitalMap = {};
    requests.forEach(r => {
      const name = r.hospital.entity_name;
      hospitalMap[name] = (hospitalMap[name] || 0) + r.units_needed;
    });

    const hospitalRequestsData = Object.keys(hospitalMap).map(name => ({
      hospital_name: name,
      total_units: hospitalMap[name]
    }));

    hospitalRequestsData.sort((a, b) => b.total_units - a.total_units);

        const samples = await mainDb.bloodSample.findMany({
      include: { station: { select: { entity_name: true } } }
    });

    const stationMap = {};
    samples.forEach(s => {
      const name = s.station.entity_name;
      stationMap[name] = (stationMap[name] || 0) + 1;
    });

    const stationCollectionsData = Object.keys(stationMap).map(name => ({
      station_name: name,
      total_samples: stationMap[name]
    }));

    stationCollectionsData.sort((a, b) => b.total_samples - a.total_samples);

    res.json({
      hospitalRequests: hospitalRequestsData,
      stationCollections: stationCollectionsData
    });
    async function triggerThreeMonthReminders(req, res) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const donors = await mainDb.donor.findMany({
      where: {
        last_donation_date: { lte: ninetyDaysAgo }
      }
    });

    let sentCount = 0;
    const details = [];