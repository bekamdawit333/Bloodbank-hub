const { mainDb, labDb } = require("../config/prisma");

// Get this hospital's internal stock levels
async function getHospitalStock(req, res) {
  try {
    const stock = await mainDb.hospitalStock.findMany({
      where: { hospital_id: req.user.id },
      select: {
        blood_type: true,
        quantity: true,
      },
    });

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hospital stock levels" });
  }
}

// Get central warehouse inventory levels (so hospital knows if central has stock)
async function getWarehouseStockLevels(req, res) {
  try {
    const levels = await mainDb.warehouseStock.groupBy({
      by: ["blood_type"],
      _sum: { quantity: true },
    });

    const formatted = levels.map((l) => ({
      blood_type: l.blood_type,
      quantity: l._sum.quantity || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch warehouse stock levels" });
  }
}
