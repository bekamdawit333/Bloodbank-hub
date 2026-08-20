const { mainDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');

// Get stock levels of this warehouse
async function getStockLevels(req, res) {
  try {
    const stock = await mainDb.warehouseStock.findMany({
      where: { warehouse_id: req.user.id },
      select: {
        blood_type: true,
        quantity: true
      }
    });
    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve stock levels' });
  }
}
// Get pending hospital requests
async function getIncomingRequests(req, res) {
  try {
    const requests = await mainDb.hospitalRequest.findMany({
      where: { status: 'pending' },
      include: {
        hospital: { select: { entity_name: true } }
      },
      orderBy: { created_at: 'asc' }
    });

    const formatted = requests.map(r => ({
      id: r.id,
      hospital_id: r.hospital_id,
      hospital_name: r.hospital.entity_name,
      blood_type: r.blood_type,
      units_needed: r.units_needed,
      status: r.status,
      created_at: r.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch incoming hospital requests' });
  }
}
// Fulfill hospital request: reduces warehouse stock and increments hospital stock
async function fulfillHospitalRequest(req, res) {
  const { id } = req.params;

  try {
    const request = await mainDb.hospitalRequest.findUnique({
      where: { id },
      include: { hospital: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Hospital request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request has already been ${request.status}` });
    }

    // Check warehouse stock level
    const stock = await mainDb.warehouseStock.findUnique({
      where: {
        warehouse_id_blood_type: {
          warehouse_id: req.user.id,
          blood_type: request.blood_type
        }
      }
    });

    const availableQty = stock ? stock.quantity : 0;
    if (availableQty < request.units_needed) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${availableQty} units of ${request.blood_type}`
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request fulfillment' });
  }
}
    // Execute fulfillment transaction
    await mainDb.$transaction(async (tx) => {
      // 1. Decrement warehouse stock
      await tx.warehouseStock.update({
        where: {
          warehouse_id_blood_type: {
            warehouse_id: req.user.id,
            blood_type: request.blood_type
          }
        },
        data: {
          quantity: { decrement: request.units_needed }
        }
      });

      // 2. Increment hospital stock
      await tx.hospitalStock.upsert({
        where: {
          hospital_id_blood_type: {
            hospital_id: request.hospital_id,
            blood_type: request.blood_type
          }
        },
        update: {
          quantity: { increment: request.units_needed }
        },
        create: {
          hospital_id: request.hospital_id,
          blood_type: request.blood_type,
          quantity: request.units_needed
        }
      });

      // Find oldest validated samples of the requested blood type in the warehouse
      const availableSamples = await tx.bloodSample.findMany({
        where: {
          blood_type: request.blood_type,
          status: 'validated',
          hospital_id: null
        },
        orderBy: {
          collected_at: 'asc'
        },
        take: request.units_needed
      });

      // Update their hospital_id to request.hospital_id
      if (availableSamples.length > 0) {
        const sampleIds = availableSamples.map(s => s.id);
        await tx.bloodSample.updateMany({
          where: {
            id: { in: sampleIds }
          },
          data: {
            hospital_id: request.hospital_id
          }
        });
      }

      // 3. Mark request as fulfilled
      await tx.hospitalRequest.update({
        where: { id },
        data: { status: 'fulfilled' }
      });
    });
