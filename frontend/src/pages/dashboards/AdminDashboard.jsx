import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard({ tab, setTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registryCategory, setRegistryCategory] = useState('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'users') {
        const usersData = await api.admin.getUsers();
        setUsers(usersData);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleStatusUpdate = async (userId, newStatus) => {
    setLoading(true);
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      const usersData = await api.admin.getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (registryCategory === 'all') return true;
    if (registryCategory === 'laboratory') return u.role === 'laboratory';
    if (registryCategory === 'station') return u.role === 'station';
    return u.role !== 'laboratory' && u.role !== 'station';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {error && (
        <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '16px', border: '1px solid rgba(239,35,60,0.2)' }}>
          {error}
        </div>
      )}

      {tab === 'users' && (
        <div className="glass-card animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Pending Workstation Authorizations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Hospitals, labs, stations, and warehouses must receive administrative approval before they can log in.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
            {['all', 'laboratory', 'station', 'others'].map(cat => {
              const isActive = registryCategory === cat;
              let label = cat === 'all' ? 'All Workstations' : cat === 'laboratory' ? '🔬 Laboratory' : cat === 'station' ? '🏥 Donation Stations' : '⚙️ Hospitals & Warehouses';
              let count = cat === 'all' ? users.length : users.filter(u => cat === 'laboratory' ? u.role === 'laboratory' : cat === 'station' ? u.role === 'station' : (u.role !== 'laboratory' && u.role !== 'station')).length;

              return (
                <button
                  key={cat}
                  onClick={() => setRegistryCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontSize: '0.72rem', background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>{count}</span>
                </button>
              );
            })}
          </div>

          {loading && users.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading registries...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '20px 0' }}>No workstation registrations found in this category.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workstation Email</th>
                    <th>Role Workspace</th>
                    <th>Facility Name</th>
                    <th>Approval Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.entity_name}</td>
                      <td>
                        <span className={`badge badge-${u.status}`}>{u.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {u.status !== 'approved' && (
                            <button onClick={() => handleStatusUpdate(u.id, 'approved')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.72rem', background: '#06d6a0', borderColor: '#06d6a0' }} disabled={loading}>
                              <ShieldCheck size={12} /> Approve
                            </button>
                          )}
                          {u.status !== 'rejected' && (
                            <button onClick={() => handleStatusUpdate(u.id, 'rejected')} className="btn" style={{ padding: '6px 12px', fontSize: '0.72rem', background: 'rgba(239,35,60,0.1)', color: '#ef233c', border: '1px solid rgba(239,35,60,0.2)' }} disabled={loading}>
                              <ShieldAlert size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )}
