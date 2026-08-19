const { mainDb, labDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');

async function getPendingSamples(req, res) {
  try {
    // Database query will go here
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending lab samples' });
  }
}
    const samples = await mainDb.bloodSample.findMany({
      where: {
        lab_id: req.user.id,
        status: 'pending_lab'
      },
      include: {
        donor: { select: { name: true, phone: true } },
        station: { select: { entity_name: true } }
      },
      orderBy: { collected_at: 'asc' }
    });

    const formatted = samples.map(s => ({
      ...s,
      donor_name: s.donor.name,
      donor_phone: s.donor.phone,
      station_name: s.station.entity_name
    }));

    res.json(formatted);
    
