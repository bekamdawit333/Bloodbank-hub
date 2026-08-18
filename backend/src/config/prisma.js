
const { PrismaClient: PostgresClient } = require('@prisma/client');
const { PrismaClient: LabClient } = require('../generated/lab-client');
const mainDb = new PostgresClient();
const labDb = new LabClient();
module.exports = {
  mainDb,
  labDb,
};
