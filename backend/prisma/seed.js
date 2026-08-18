const { mainDb, labDb } = require("../src/config/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Start seeding...");

  // 1. Hash passwords
  const adminHash = bcrypt.hashSync("admin123", 10);

  // 2. Clear existing PostgreSQL tables
  await mainDb.emailVerification.deleteMany({});
  await mainDb.sentSmsLog.deleteMany({});
  await mainDb.bloodSample.deleteMany({});
  await mainDb.donor.deleteMany({});
  await mainDb.warehouseStock.deleteMany({});
  await mainDb.hospitalStock.deleteMany({});
  await mainDb.hospitalRequest.deleteMany({});
  await mainDb.hospitalInterRequest.deleteMany({});
  await mainDb.announcement.deleteMany({});
  await mainDb.user.deleteMany({});

  // 3. Clear existing Lab database tables
  await labDb.labMedicalRecord.deleteMany({});

  // 4. Seed only the central Admin user
  const admin = await mainDb.user.create({
    data: {
      email: "admin@bloodbank.org",
      password_hash: adminHash,
      role: "admin",
      status: "approved",
      entity_name: "Central Administration",
    },
  });

  console.log("Seeded admin user.");
}
