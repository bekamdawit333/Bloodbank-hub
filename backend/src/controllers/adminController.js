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