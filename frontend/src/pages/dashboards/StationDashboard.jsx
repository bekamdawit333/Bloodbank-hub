
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function StationDashboard() {
  const [labs, setLabs] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchLabsAndSamples = async () => {
    setLoading(true);
    try {
      const samplesList = await api.station.getSamples();
      setSamples(samplesList);

      const approvedLabs = await api.station.getLabs();
      setLabs(approvedLabs);
    } catch (err) {
      setError('Failed to fetch station logs or laboratory resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabsAndSamples();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Workstation placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Donor Check-In Scanner</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Station workstation ready. Ready to scan donor FAYDA ID or mobile number.
            </p>
          </div>

          {error && (
            <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '16px', border: '1px solid rgba(239,35,60,0.2)' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="glass-card" style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', padding: '16px', border: '1px solid rgba(58,134,255,0.2)' }}>
              {success}
            </div>
          )}
        </div>

        {/* Right Side: Station collection logging */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Station Dispatch Log</h3>
          {samples.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No blood bags collected today.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Type</th>
                    <th>Routed Lab</th>
                    <th>Bag Status</th>
                    <th>Collected Date</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.donor_name}</td>
                      <td>
                        <span className="badge-blood-type">{s.blood_type}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.lab_name}</td>
                      <td>
                        <span className={`badge badge-${s.status}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(s.collected_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
