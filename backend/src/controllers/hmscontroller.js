const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const admitPatient = async (req, res) => {
  const hospital_id = req.user.id;
  const { full_name, age, gender, blood_type, fayda_id, ward, bed_number, diagnosis } = req.body;

  if (!full_name || !age || !gender || !blood_type || !ward || !bed_number) {
    return res.status(400).json({ error: 'full_name, age, gender, blood_type, ward, and bed_number are required.' });
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        hospital_id,
        full_name,
        age: parseInt(age),
        gender,
        blood_type,
        fayda_id: fayda_id || null,
        ward,
        bed_number,
        diagnosis: diagnosis || null,
        admission_status: 'admitted',
      },
    });
    res.status(201).json(patient);
  } catch (err) {
    console.error('[HMS] admitPatient error:', err);
    res.status(500).json({ error: 'Failed to admit patient.' });
  }
};

const getPatients = async (req, res) => {
  const hospital_id = req.user.id;
  const { status } = req.query;  

  try {
    const patients = await prisma.patient.findMany({
      where: {
        hospital_id,
        ...(status ? { admission_status: status } : {}),
      },
      include: {
        bloodOrders: {
          orderBy: { ordered_at: 'desc' },
          take: 1, 
        },
      },
      orderBy: { admitted_at: 'desc' },
    });
    res.json(patients);
  } catch (err) {
    console.error('[HMS] getPatients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients.' });
  }
};


const getPatientById = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id, hospital_id },
      include: {
        bloodOrders: {
          orderBy: { ordered_at: 'desc' },
          include: { requisition: true },
        },
        bloodSamples: {
          orderBy: { collected_at: 'desc' },
        },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    console.error('[HMS] getPatientById error:', err);
    res.status(500).json({ error: 'Failed to fetch patient.' });
  }
};

const dischargePatient = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({ where: { id, hospital_id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    if (patient.admission_status === 'discharged') {
      return res.status(400).json({ error: 'Patient is already discharged.' });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        admission_status: 'discharged',
        discharged_at: new Date(),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[HMS] dischargePatient error:', err);
    res.status(500).json({ error: 'Failed to discharge patient.' });
  }
};
