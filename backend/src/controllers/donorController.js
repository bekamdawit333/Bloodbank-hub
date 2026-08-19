const { mainDb } = require('../config/prisma');
async function getDonorDashboardInfo(req, res) {
  try {
    
    const donor = await mainDb.donor.findUnique({
      where: { user_id: req.user.id }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found for this user.' });
    }

   
    const history = await mainDb.bloodSample.findMany({
      where: { fayda_id: donor.fayda_id },
      include: {
        station: { select: { entity_name: true } },
        lab: { select: { entity_name: true } }
      },
      orderBy: { collected_at: 'desc' }
    });

    const formattedHistory = history.map(h => ({
      id: h.id,
      collected_at: h.collected_at,
      blood_type: h.blood_type,
      status: h.status,
      health_notes: h.health_notes,
      station_name: h.station.entity_name,
      lab_name: h.lab ? h.lab.entity_name : 'Pending Screen'
    }));

    // 3. Fetch top 10 leaderboard (ordered by points descending)
    const leaderboard = await mainDb.donor.findMany({
      take: 10,
      select: {
        fayda_id: true,
        name: true,
        blood_type: true,
        points: true,
       
        _count: {
          select: { bloodSamples: true }
        }
      },
      orderBy: [
        { points: 'desc' },
        { fayda_id: 'asc' }
      ]
    });

    const formattedLeaderboard = leaderboard.map((d, index) => ({
      rank: index + 1,
      name: d.name,
      blood_type: d.blood_type,
      points: d.points,
      total_donations: d._count.bloodSamples
    }));


    const announcements = await mainDb.announcement.findMany({
      include: {
        warehouse: { select: { entity_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedAnnouncements = announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      station_location: a.station_location,
      start_date: a.start_date,
      end_date: a.end_date,
      created_at: a.created_at,
      publisher: a.warehouse.entity_name
    }));

    //  Calculate eligibility countdown
    let isEligible = true;
    let daysRemaining = 0;
    let nextDonationDate = null;

    if (donor.last_donation_date) {
      const lastDonation = new Date(donor.last_donation_date);
      // Next donation date is exactly 90 days (3 months) later
      const nextDate = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
      const today = new Date();
      nextDonationDate = nextDate;

      if (today < nextDate) {
        isEligible = false;
        const diffTime = nextDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      donor: {
        fayda_id: donor.fayda_id,
        name: donor.name,
        phone: donor.phone,
        dob: donor.dob,
        gender: donor.gender,
        address: donor.address,
        blood_type: donor.blood_type,
        points: donor.points,
        last_donation_date: donor.last_donation_date
      },
      history: formattedHistory,
      leaderboard: formattedLeaderboard,
      announcements: formattedAnnouncements,
      eligibility: {
        is_eligible: isEligible,
        days_remaining: daysRemaining,
        next_donation_date: nextDonationDate
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compile donor dashboard information' });
  }
}
