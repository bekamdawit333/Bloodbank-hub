const { mainDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcryptjs');

// Get all system users (excluding admins)
async function getUsers(req, res) {
  try {
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
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve system users' });
  }
}

// Approve/Reject system user registration, or finalize an approved deletion request
async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'approved', 'rejected', or 'deleted'

  if (!['approved', 'rejected', 'deleted'].includes(status)) {
    return res.status(400).json({ error: 'Invalid registration status option' });
  }

  try {
    if (status === 'deleted') {
      return await deleteUserInternal(req, res);
    }

    const user = await mainDb.user.update({
      where: { id },
      data: { status }
    });

    await logAction(
      req.user.id,
      `USER_REGISTRATION_${status.toUpperCase()}`,
      `Updated registration status for user ${user.email} (${user.role}) to: ${status}.`
    );

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
    res.status(500).json({ error: 'Failed to update user registration status' });
  }
}

// Permanently remove a user account (admin initiated or approved request)
async function deleteUserInternal(req, res) {
  const { id } = req.params;

  const target = await mainDb.user.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }

  if (target.role === 'admin') {
    res.status(403).json({ error: 'Administrator accounts cannot be deleted.' });
    return null;
  }

  // Preserve the audit trail: this entry is logged under the admin's id,
  // because cascade will remove logs owned by the deleted user.
  await logAction(
    req.user.id,
    'ACCOUNT_DELETED',
    `Admin ${req.user.email} deleted ${target.role} account ${target.email} (${target.entity_name}). Status prior to deletion: ${target.status}.`
  );

  await mainDb.user.delete({ where: { id } });

  return target;
}

// Admin directly deletes any non-admin account
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const target = await deleteUserInternal(req, res);
    if (!target) return; // response already sent

    res.json({
      message: `Account ${target.email} (${target.role}) has been permanently deleted.`
    });
  } catch (err) {
    console.error('[adminController] deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user account.' });
  }
}

// Admin approves a workstation deletion request -> permanent delete
async function approveDeletionRequest(req, res) {
  try {
    const { id } = req.params;
    const target = await mainDb.user.findUnique({ where: { id } });

    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target.status !== 'deletion_requested') {
      return res.status(400).json({ error: 'This account has no pending deletion request.' });
    }

    const deleted = await deleteUserInternal(req, res);
    if (!deleted) return;

    res.json({
      message: `Deletion approved. Account ${target.email} (${target.role}) has been permanently removed.`
    });
  } catch (err) {
    console.error('[adminController] approveDeletionRequest error:', err);
    res.status(500).json({ error: 'Failed to approve deletion request.' });
  }
}

// Compute dashboard analytics (requests bar chart and collection pie chart)
async function getAdminAnalytics(req, res) {
  try {
    // 1. Fetch hospital requests and sum units needed per hospital
    const requests = await mainDb.hospitalRequest.findMany({
      include: {
        hospital: { select: { entity_name: true } }
      }
    });

    const hospitalMap = {};
    requests.forEach(r => {
      const name = r.hospital.entity_name;
      hospitalMap[name] = (hospitalMap[name] || 0) + r.units_needed;
    });

    const hospitalRequestsData = Object.keys(hospitalMap).map(name => ({
      hospital_name: name,
      total_units: hospitalMap[name]
    }));

    // Sort by total units descending for readability
    hospitalRequestsData.sort((a, b) => b.total_units - a.total_units);

    // 2. Fetch blood samples collected and count collections per station
    const samples = await mainDb.bloodSample.findMany({
      include: {
        station: { select: { entity_name: true } }
      }
    });

    const stationMap = {};
    samples.forEach(s => {
      const name = s.station.entity_name;
      stationMap[name] = (stationMap[name] || 0) + 1;
    });

    const stationCollectionsData = Object.keys(stationMap).map(name => ({
      station_name: name,
      total_samples: stationMap[name]
    }));

    // Sort by total samples descending
    stationCollectionsData.sort((a, b) => b.total_samples - a.total_samples);

    // 3. Overall KPI aggregations
    // Only donors with a registered (linked) account count here - raw FAYDA
    // registry profiles without an account do not appear in the Users directory.
    const totalDonors = await mainDb.donor.count({
      where: { user_id: { not: null } }
    });
    // Approved workstations only (admins excluded) so this matches what the
    // admin sees under the Users registry.
    const totalWorkstations = await mainDb.user.count({
      where: { role: { notIn: ['donor', 'admin'] }, status: 'approved' }
    });
    const stockAgg = await mainDb.warehouseStock.aggregate({
      _sum: { quantity: true }
    });
    const totalStock = stockAgg._sum.quantity || 0;
    const pendingRequests = await mainDb.hospitalRequest.count({
      where: { status: 'pending' }
    });

    res.json({
      totalDonors,
      totalWorkstations,
      totalStock,
      pendingRequests,
      hospitalRequests: hospitalRequestsData,
      stationCollections: stationCollectionsData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve administrative analytics' });
  }
}

// Manual/automatic routine to trigger 3-month donation reminders via SMS
async function triggerThreeMonthReminders(req, res) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find all donors who donated at least 90 days ago
    const donors = await mainDb.donor.findMany({
      where: {
        last_donation_date: {
          lte: ninetyDaysAgo
        }
      }
    });

    let sentCount = 0;
    const details = [];

    for (const donor of donors) {
      // Find their most recent blood sample
      const lastSample = await mainDb.bloodSample.findFirst({
        where: { fayda_id: donor.fayda_id },
        orderBy: { collected_at: 'desc' }
      });

      if (!lastSample) {
        console.log(`[Reminder System] Donor ${donor.name} has no logged samples to associate reminder SMS.`);
        continue;
      }

      // Check if reminder was already sent for this sample
      const existingReminderLog = await mainDb.sentSmsLog.findUnique({
        where: {
          blood_sample_id_message_type: {
            blood_sample_id: lastSample.id,
            message_type: 'reminder'
          }
        }
      });

      if (existingReminderLog) {
        // Already reminded for this donation
        continue;
      }

      // Send the reminder SMS
      const reminderMessage = `Dear ${donor.name}, 3 months have passed since your last blood donation! You are now eligible to donate again. Please visit a collection station to save lives. - Blood Bank Hub`;
      await sendSMS(donor.phone, reminderMessage, lastSample.id, 'reminder');
      sentCount++;
      details.push({ 
        donor: donor.name, 
        phone: donor.phone, 
        lastDonation: donor.last_donation_date 
      });
    }

    res.json({
      message: `Checked for eligible donors. Sent ${sentCount} reminders.`,
      sentCount,
      details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process 3-month reminders' });
  }
}

// Retrieve audit log history
async function getAuditLogs(req, res) {
  try {
    const logs = await mainDb.auditLog.findMany({
      include: {
        user: { select: { email: true, entity_name: true, role: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve system audit logs' });
  }
}

// Get password reset tickets
async function getPasswordResetRequests(req, res) {
  try {
    const requests = await mainDb.passwordResetRequest.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error('[adminController] getPasswordResetRequests error:', err);
    res.status(500).json({ error: 'Failed to retrieve password reset requests.' });
  }
}

// Resolve password reset ticket by applying new password
async function resolvePasswordResetRequest(req, res) {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  try {
    const ticket = await mainDb.passwordResetRequest.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Password reset request not found.' });
    }

    if (ticket.status === 'resolved') {
      return res.status(400).json({ error: 'Request is already resolved.' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update target user
    await mainDb.user.update({
      where: { id: ticket.user_id },
      data: { password_hash: passwordHash }
    });

    // Mark ticket as resolved
    await mainDb.passwordResetRequest.update({
      where: { id },
      data: { status: 'resolved' }
    });

    // Audit log
    await logAction(
      req.user.id,
      'PASSWORD_RESET_RESOLVED',
      `Admin resolved password reset ticket for ${ticket.email} (${ticket.role}).`
    );

    res.json({ message: `Successfully reset password for ${ticket.email}.` });
  } catch (err) {
    console.error('[adminController] resolvePasswordResetRequest error:', err);
    res.status(500).json({ error: 'Failed to resolve password reset request.' });
  }
}

module.exports = {
  getUsers,
  updateUserStatus,
  getAdminAnalytics,
  triggerThreeMonthReminders,
  getAuditLogs,
  getPasswordResetRequests,
  resolvePasswordResetRequest,
  deleteUser,
  approveDeletionRequest,
};
