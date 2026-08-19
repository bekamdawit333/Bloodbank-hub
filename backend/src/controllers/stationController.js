const { mainDb } = require('../config/prisma');

async function lookupDonor(req, res) {
  const { id } = req.params; 
  try {
    const donor = await mainDb.donor.findFirst({
      where: {
        OR: [
          { fayda_id: id },
          { phone: id }
        ]
      }
    });

    if (!donor) {
      return res.status(200).json({
        found: false,
        message: 'Donor not found. Proceed with new donor registration procedure.'
      });
    }

    let isEligible = true;
    let daysRemaining = 0;

    if (donor.last_donation_date) {
      const lastDonation = new Date(donor.last_donation_date);
      const today = new Date();
      const diffTime = Math.abs(today - lastDonation);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 90) {
        isEligible = false;
        daysRemaining = 90 - diffDays;
      }
    }

    res.json({
      found: true,
      donor,
      eligibility: {
        is_eligible: isEligible,
        days_remaining: daysRemaining,
        message: isEligible
          ? 'Returning donor is eligible. Proceed to blood sample collection.'
          : `Ineligible. Must wait ${daysRemaining} more days before donating again.`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to look up donor details' });
  }
}
