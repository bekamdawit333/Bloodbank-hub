import React from 'react';
import { Award, Heart } from 'lucide-react';

export default function Leaderboard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No leaderboard rankings available yet.</p>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFD700', color: '#000', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Gold Winner">1</span>;
      case 2:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#C0C0C0', color: '#000', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Silver Winner">2</span>;
      case 3:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#CD7F32', color: '#FFF', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Bronze Winner">3</span>;
      default:
        return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{rank}</span>;
    }
  };
}
