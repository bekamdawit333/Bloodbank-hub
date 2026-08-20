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
