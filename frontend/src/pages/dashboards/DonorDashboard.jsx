import React, { useState, useEffect } from 'react';
import { Heart, Gift } from 'lucide-react';
import { api } from '../../services/api';

export default function DonorDashboard({ activeTab, setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      const dashboardInfo = await api.donor.getDashboardInfo();
      setData(dashboardInfo);
    } catch (err) {
      setError(err.message || 'Failed to load donor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading donor workspace dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '20px' }}>
        {error || 'Profile details unavailable.'}
      </div>
    );
  }

  const { donor } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Donor stats cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Donor Profile Detail Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Donor Profile</h4>
            <Heart size={16} color="var(--primary)" fill="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0' }}>{donor.name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Phone: {donor.phone}</p>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>Blood Type: <strong>{donor.blood_type}</strong></span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>ID: <strong>{donor.fayda_id}</strong></span>
          </div>
        </div>

        {/* Points Rewards Accumulator Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid #8338ec' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Donor Reward Points</h4>
            <Gift size={16} color="#8338ec" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#8338ec' }}>{donor.points}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>points</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Earn 100 points for every validated blood donation. Rank up on the leaderboard!
          </p>
        </div>

      </div>

    </div>
  );
}
