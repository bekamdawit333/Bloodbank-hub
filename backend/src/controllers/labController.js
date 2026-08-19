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
    async function getWarehouses(req, res) {
  try {
    const warehouses = await mainDb.user.findMany({
      where: {
        role: 'warehouse',
        status: 'approved'
      },
      select: {
        id: true,
        entity_name: true
      }
    });
    res.json(warehouses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
}
async function submitTestResult(req, res) {
  const { id } = req.params;
  const {
    status,
    warehouse_id,
    health_notes,
    hemoglobin,
    platelets,
    allergies,
    diseases,
    blood_type
  } = req.body;

  if (!['validated', 'discarded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid validation status' });
  }
  if (status === 'validated' && !warehouse_id) {
    return res.status(400).json({ error: 'Destination Warehouse is required for validated blood' });
  }
  if (status === 'validated' && (!blood_type || blood_type === 'UNKNOWN')) {
    return res.status(400).json({ error: 'A valid tested blood type is required to validate the sample' });
  }
}
