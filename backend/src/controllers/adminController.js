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