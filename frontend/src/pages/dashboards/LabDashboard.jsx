import React, { useState, useEffect } from 'react';
import { Shield, Check, Trash2, ShieldCheck, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export default function LabDashboard() {
  const [samples, setSamples] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Screening form state
  const [selectedSample, setSelectedSample] = useState(null);
  const [testStatus, setTestStatus] = useState('validated'); // validated, discarded
  const [warehouseId, setWarehouseId] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Vitals & Diseases input fields
  const [hemoglobin, setHemoglobin] = useState('14.5 g/dL');
  const [platelets, setPlatelets] = useState('250,000 /mcL');
  const [allergies, setAllergies] = useState('None');
  const [bloodType, setBloodType] = useState('O+');
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await api.lab.getPendingSamples();
      setSamples(pending);

      const wh = await api.lab.getWarehouses();
      setWarehouses(wh);
      if (wh.length > 0) {
        setWarehouseId(wh[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve laboratory work items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
    const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setTestStatus('validated');
    setHealthNotes('');
    setHemoglobin('14.5 g/dL');
    setPlatelets('250,000 /mcL');
    setAllergies('None');
    setBloodType(sample.blood_type === 'UNKNOWN' ? 'O+' : sample.blood_type);
    setSelectedDiseases([]);
  };

  const handleDiseaseToggle = (disease) => {
    setSelectedDiseases(prev => 
      prev.includes(disease) 
        ? prev.filter(d => d !== disease) 
        : [...prev, disease]
    );
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const finalDiseases = testStatus === 'validated'
      ? 'HIV: Negative, Syphilis: Negative, Hepatitis: Negative'
      : selectedDiseases.length > 0 
        ? selectedDiseases.map(d => `${d}: Positive`).join(', ') 
        : 'Abnormal clinical markers';

    const payload = {
      status: testStatus,
      health_notes: healthNotes,
      warehouse_id: testStatus === 'validated' ? warehouseId : undefined,
      hemoglobin,
      platelets,
      allergies,
      diseases: finalDiseases,
      blood_type: bloodType
    };

    try {
      const data = await api.lab.submitTestResult(selectedSample.id, payload);
      setSuccess(data.message);
      setSelectedSample(null);
      // Reload pending logs
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit test findings.');
    } finally {
      setLoading(false);
    }
  };
    return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedSample ? '1fr 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
      
      {/* Pending workstation items queue */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Pending Screening Screening Queue</h3>
          </div>
          <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw size={12} /> Reload Queue
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {success}
          </div>
        )}

        {loading && samples.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading pending collections...</p>
        ) : samples.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Screening workspace clean. No pending blood bags routed to you.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Donor Patient</th>
                  <th>Blood Type</th>
                  <th>Collection Station</th>
                  <th>Logged Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(s => (
                  <tr key={s.id} style={{ 
                    background: selectedSample?.id === s.id ? 'rgba(239, 35, 60, 0.05)' : 'transparent' 
                  }}>
                    <td style={{ fontWeight: 600 }}>{s.donor_name}</td>
                    <td>
                      <span className="badge-blood-type">{s.blood_type}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.station_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(s.collected_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSelectSample(s)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Run Screening Screen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    );
   
}
