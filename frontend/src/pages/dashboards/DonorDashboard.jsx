import React, { useState, useEffect } from 'react';
import { 
  Heart, Clock, History, Gift, Award, Megaphone, CheckCircle2, Calendar, 
  Star, Droplet, ArrowRight, User, ShieldCheck, MapPin, Check, MessageSquare, Mail, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import Leaderboard from '../../components/common/Leaderboard';
import Announcements from '../../components/common/Announcements';
import BottomToast from '../../components/common/BottomToast';

export default function DonorDashboard({ activeTab = 'dashboard', setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  // Real-time countdown state
  const [countdownText, setCountdownText] = useState('');
  const [isEligibleNow, setIsEligibleNow] = useState(true);

  // Appointments states
  const [appointments, setAppointments] = useState([]);
  const [stations, setStations] = useState([]);
  const [bookingStationId, setBookingStationId] = useState('');
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Messages states
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadAppointments = async () => {
    try {
      const appts = await api.donor.getAppointments();
      setAppointments(appts || []);
      const stats = await api.donor.getStations();
      setStations(stats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const msgs = await api.donor.getMessages();
      setMessages(msgs || []);
      if (msgs && msgs.length > 0 && !selectedMessage) {
        setSelectedMessage(msgs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments' || activeTab === 'reminders') {
      loadAppointments();
    }
    if (activeTab === 'messages') {
      loadMessages();
    }
  }, [activeTab]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingStationId || !bookingDateTime) {
      setBookingError('Please select both a donation station and a schedule slot.');
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const res = await api.donor.bookAppointment(bookingStationId, bookingDateTime);
      setBookingSuccess(res.message || 'Appointment scheduled successfully!');
      setBookingStationId('');
      setBookingDateTime('');
      await loadAppointments();
    } catch (err) {
      setBookingError(err.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    try {
      await api.donor.cancelAppointment(apptId);
      await loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardInfo = await api.donor.getDashboardInfo();
      setData(dashboardInfo);
      setIsEligibleNow(dashboardInfo?.eligibility?.is_eligible ?? true);
    } catch (err) {
      setError(err.message || 'Failed to load donor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!data || !data.eligibility || data.eligibility.is_eligible || !data.eligibility.next_donation_date) {
      setIsEligibleNow(true);
      return;
    }

    const nextDate = new Date(data.eligibility.next_donation_date);
    setIsEligibleNow(false);

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextDate - now;

      if (diff <= 0) {
        setIsEligibleNow(true);
        setCountdownText('You are eligible to donate blood today!');
        clearInterval(intervalId);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdownText(`${days}d ${hours}h remaining`);
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [data]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading donor workspace dashboard...</div>;
  }

  const donor = data?.donor || { name: 'Abebe Kebede', blood_type: 'B+', points: 1250, phone: '+251911223344', fayda_id: 'FAY-88219' };
  const history = data?.history || [];
  const leaderboard = data?.leaderboard || [];
  const announcements = data?.announcements || [];

  // Demo campaigns fallback
  const displayCampaigns = announcements.length > 0 ? announcements.slice(0, 3) : [
    { id: 1, title: 'Addis Ababa Mega Drive', date: '20 Aug 2025', location: 'Meskel Square' },
    { id: 2, title: 'University Blood Drive', date: '28 Aug 2025', location: 'AAU Campus' },
    { id: 3, title: 'Community Donation', date: '05 Sep 2025', location: 'Lideta Center' }
  ];

  // Demo history fallback
  const displayHistory = history.length > 0 ? history.slice(0, 3) : [
    { id: 1, collected_at: '2025-05-15', station_name: 'Addis Ababa Station', status: 'validated' },
    { id: 2, collected_at: '2025-02-10', station_name: 'University Drive', status: 'validated' },
    { id: 3, collected_at: '2024-11-12', station_name: 'Lideta Center', status: 'validated' }
  ];

  const totalDonations = history.length > 0 ? history.length : 8;
  const livesSaved = totalDonations * 3;

  return (
    <div className="dashboard-container">

      {error && (
        <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239,35,60,0.2)' }}>
          {error}
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={bookingSuccess} onClose={() => setBookingSuccess(null)} />

      {/* DASHBOARD OVERVIEW TAB */}
      {(activeTab === 'dashboard' || activeTab === 'main' || !activeTab) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Header Greeting */}
          <div className="dashboard-header">
            <h2>Welcome, {donor.name}! <span role="img" aria-label="wave">&#x1F44B;</span></h2>
            <p>Thank you for being a life saver.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">
            
            {/* Stat 1: Loyalty Points */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Loyalty Points</span>
                <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#f59e0b' }}>
                  <Star size={18} fill="#f59e0b" />
                </div>
              </div>
              <div className="stat-card-value">{donor.points || '1,250'}</div>
              <div className="stat-card-trend trend-up">
                <span>+50 this month</span>
              </div>
            </div>

            {/* Stat 2: Total Donations */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Donations</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <Heart size={18} fill="#ef233c" />
                </div>
              </div>
              <div className="stat-card-value">{totalDonations}</div>
              <div className="stat-card-trend trend-up">
                <span>+1 this month</span>
              </div>
            </div>

            {/* Stat 3: Next Eligible Date */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Next Eligible Date</span>
                <div className="stat-card-icon" style={{ background: 'rgba(58,134,255,0.12)', color: '#3a86ff' }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                {data?.eligibility?.next_donation_date 
                  ? new Date(data.eligibility.next_donation_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'Ready to Donate'}
              </div>
              <div className="stat-card-trend" style={{ color: isEligibleNow ? '#06d6a0' : '#ef233c' }}>
                <span>{isEligibleNow ? '✓ Eligible to donate today' : countdownText || `${data?.eligibility?.days_remaining || 0}d remaining`}</span>
              </div>
            </div>

            {/* Stat 4: Blood Type */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Blood Type</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <Droplet size={18} fill="#ef233c" />
                </div>
              </div>
              <div className="stat-card-value">{donor.blood_type || 'B+'}</div>
              <div className="stat-card-trend trend-neutral">
                <span>Positive</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">
            
            {/* Card 1: Upcoming Campaigns */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Upcoming Campaigns</span>
                <Megaphone size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayCampaigns.map((camp, idx) => (
                  <div key={camp.id || idx} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {camp.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        📍 {camp.location || 'Addis Ababa'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {camp.date || new Date(camp.start_date || Date.now()).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setActiveTab('campaigns')} 
                className="view-all-btn"
              >
                View All Campaigns <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: Eligibility Status */}
            <div className="dashboard-card" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
              <div className="dashboard-card-title" style={{ width: '100%', textAlign: 'left' }}>
                <span>Eligibility Status</span>
              </div>

              <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: isEligibleNow ? 'rgba(6,214,160,0.15)' : 'rgba(255,209,102,0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: isEligibleNow ? '#06d6a0' : '#f59e0b'
                }}>
                  {isEligibleNow ? <CheckCircle2 size={32} /> : <Clock size={32} />}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: isEligibleNow ? '#06d6a0' : '#f59e0b' }}>
                    {isEligibleNow ? 'You are eligible to donate' : 'Safety Window Active'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: '200px' }}>
                    {isEligibleNow 
                      ? 'You can donate blood now at any registered blood bank station.'
                      : `Next eligible date: ${countdownText || 'in a few weeks'}`}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('appointments')} 
                className="quick-action-btn"
                style={{ marginTop: 'auto', fontSize: '0.78rem', padding: '8px 14px' }}
              >
                {isEligibleNow ? 'Schedule Donation' : 'View Eligibility Details'}
              </button>
            </div>

            {/* Card 3: Donation History */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Donation History</span>
                <History size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayHistory.map((h, idx) => (
                  <div key={h.id || idx} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {new Date(h.collected_at || Date.now()).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {h.station_name || 'Addis Ababa Station'}
                      </div>
                    </div>
                    <span className="badge badge-approved" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      Completed
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setActiveTab('history')} 
                className="view-all-btn"
              >
                View All History <ArrowRight size={13} />
              </button>
            </div>

          </div>

          {/* Bottom Motivational Alert Bar */}
          <div style={{ 
            background: 'linear-gradient(90deg, rgba(239,35,60,0.12) 0%, rgba(239,35,60,0.04) 100%)', 
            border: '1px solid rgba(239,35,60,0.25)', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ef233c', color: '#fff', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                <Heart size={16} fill="#fff" />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                ❤️ You have saved {livesSaved} lives so far. Thank you for your continued dedication!
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('campaigns')} 
              className="btn btn-primary" 
              style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              View Campaigns
            </button>
          </div>

        </div>
      )}

      {/* DONATION HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Donation Record Book</h2>
            <p>Your complete donation track record across all certified collection stations.</p>
          </div>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>You haven't logged any donations in this portal yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donation Date</th>
                    <th>Blood Type</th>
                    <th>Workstation Station</th>
                    <th>Screening Status</th>
                    <th>Lab Clinical Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{new Date(h.collected_at).toLocaleDateString()}</td>
                      <td>
                        <span style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem' }}>
                          {h.blood_type}
                        </span>
                      </td>
                      <td>{h.station_name}</td>
                      <td>
                        <span className={`badge badge-${h.status}`}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: h.status === 'discarded' ? '#ef233c' : 'var(--text-secondary)' }}>
                        {h.health_notes || 'Clinical tests passed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CAMPAIGNS & ANNOUNCEMENTS TAB */}
      {(activeTab === 'announcements' || activeTab === 'campaigns') && (
        <Announcements data={announcements} />
      )}

      {/* LEADERBOARD & REWARDS TAB */}
      {(activeTab === 'leaderboard' || activeTab === 'points') && (
        <Leaderboard data={leaderboard} />
      )}

      {/* ELIGIBILITY STATUS TAB */}
      {activeTab === 'eligibility' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>Blood Donation Eligibility Status</h2>
              <p>Verified clinical interval and safety criteria based on WHO standards.</p>
            </div>

            <div style={{
              background: isEligibleNow ? 'rgba(6,214,160,0.1)' : 'rgba(255,209,102,0.15)',
              border: isEligibleNow ? '1px solid rgba(6,214,160,0.3)' : '1px solid rgba(255,209,102,0.4)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isEligibleNow ? '#06d6a0' : '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isEligibleNow ? <CheckCircle2 size={28} /> : <Clock size={28} />}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: isEligibleNow ? '#059669' : '#d97706' }}>
                  {isEligibleNow ? '✓ Eligible to Donate' : '⚠️ Ineligible - Deferral Active'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {isEligibleNow 
                    ? 'You are currently eligible to donate blood. Your hemoglobin and donation cycle are in optimal condition.' 
                    : (countdownText || 'You must complete the 90-day recovery window before donating again.')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last Donation Date</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {data?.eligibility?.last_donation_date 
                    ? new Date(data.eligibility.last_donation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'First-time donor'}
                </strong>
              </div>

              <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Next Eligible Date</span>
                <strong style={{ fontSize: '0.95rem', color: isEligibleNow ? '#059669' : '#d97706' }}>
                  {data?.eligibility?.next_donation_date 
                    ? new Date(data.eligibility.next_donation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Ready to Donate'}
                </strong>
              </div>

              <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Blood Type</span>
                <strong style={{ fontSize: '1.1rem', color: '#ef233c', fontWeight: 800 }}>
                  {donor.blood_type}
                </strong>
              </div>

              <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Lifetime Donations</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {totalDonations} donations
                </strong>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('campaigns')} 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              <Megaphone size={16} /> View Upcoming Donation Campaigns
            </button>
          </div>

          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Eligibility Guidelines</h2>
              <p>National blood safety requirements.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>90-Day Interval:</strong> Allows your body adequate time to replenish red blood cells and ferritin iron levels.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Age & Weight:</strong> Minimum age of 18 years and weight of at least 50 kg (110 lbs).</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Hydration & Diet:</strong> Drink plenty of water and eat an iron-rich meal prior to donating.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>Schedule Donation</h2>
              <p>Choose one approved station and a future donation time.</p>
            </div>
            {bookingError && <div className="auth-error" style={{ marginBottom: '12px' }}>{bookingError}</div>}
            {bookingSuccess && <div className="auth-success" style={{ marginBottom: '12px' }}>{bookingSuccess}</div>}
            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Donation Station
                <select value={bookingStationId} onChange={(e) => setBookingStationId(e.target.value)} required style={{ width: '100%', marginTop: '5px' }}>
                  <option value="">Select station</option>
                  {stations.map(station => <option key={station.id} value={station.id}>{station.entity_name}</option>)}
                </select>
              </label>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Donation Date and Time
                <input type="datetime-local" value={bookingDateTime} min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} onChange={(e) => setBookingDateTime(e.target.value)} required style={{ width: '100%', marginTop: '5px', boxSizing: 'border-box' }} />
              </label>
              <button type="submit" className="btn btn-primary" disabled={bookingLoading} style={{ justifyContent: 'center' }}>
                <Calendar size={16} /> {bookingLoading ? 'Scheduling...' : 'Schedule Donation'}
              </button>
            </form>
          </div>

          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>My Donation Appointments</h2>
              <p>Present your FAYDA ID at the selected station. Your demographic profile will load there.</p>
            </div>
            {appointments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No scheduled appointments.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {appointments.map(appointment => (
                  <div key={appointment.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{appointment.station?.entity_name || 'Donation Station'}</strong>
                      <span className={`badge badge-${appointment.status === 'scheduled' ? 'approved' : 'pending'}`}>{appointment.status}</span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(appointment.date_time).toLocaleString()}</div>
                    {appointment.status === 'scheduled' && <button type="button" onClick={() => handleCancelAppointment(appointment.id)} className="btn" style={{ marginTop: '10px', padding: '5px 9px', fontSize: '0.72rem' }}>Cancel Appointment</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Message Inbox List */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Messages & Alerts</h2>
                <p>Notifications from blood centers and laboratory.</p>
              </div>
              <span className="badge badge-approved" style={{ fontSize: '0.72rem' }}>
                {messages.length} Messages
              </span>
            </div>

            {loadingMessages ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No messages in your inbox.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map(msg => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div 
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(239,35,60,0.08)' : 'var(--bg-main)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {msg.title}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(msg.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.content}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        From: {msg.sender}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail Viewer */}
          <div className="dashboard-card animate-fade-in">
            {selectedMessage ? (
              <div>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <span className="badge badge-approved" style={{ marginBottom: '8px', fontSize: '0.68rem' }}>
                    {selectedMessage.sender}
                  </span>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                    {selectedMessage.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Received: {new Date(selectedMessage.date).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
                  {selectedMessage.content}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setActiveTab('campaigns')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Megaphone size={14} /> View Campaigns
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Mail size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p>Select a message from the list to view full details.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MY PROFILE TAB */}
      {(activeTab === 'profile' || activeTab === 'settings') && (
        <div className="dashboard-card animate-fade-in" style={{ maxWidth: '500px' }}>
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Donor Health Profile</h2>
            <p>Your verified health and national ID credentials.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="clean-list-item">
              <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{donor.name}</strong>
            </div>
            <div className="clean-list-item">
              <span style={{ color: 'var(--text-secondary)' }}>Phone Number:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{donor.phone}</strong>
            </div>
            <div className="clean-list-item">
              <span style={{ color: 'var(--text-secondary)' }}>Blood Type:</span>
              <strong style={{ color: '#ef233c' }}>{donor.blood_type}</strong>
            </div>
            <div className="clean-list-item">
              <span style={{ color: 'var(--text-secondary)' }}>FAYDA National ID:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{donor.fayda_id}</strong>
            </div>
            <div className="clean-list-item">
              <span style={{ color: 'var(--text-secondary)' }}>Reward Points:</span>
              <strong style={{ color: '#f59e0b' }}>{donor.points} pts</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
