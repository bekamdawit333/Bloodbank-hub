import React, { useState, useEffect } from 'react';
import { Package, Truck, MessageSquare, AlertTriangle, ShieldCheck, Search, PlusCircle, RefreshCw, Send, Check, ShieldAlert, Stethoscope, UserPlus, ClipboardList, X, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { io } from 'socket.io-client';

export default function HospitalDashboard({ tab, setTab }) {
  const [internalStock, setInternalStock] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  
  const [interRequests, setInterRequests] = useState([]);
  const [patientRecord, setPatientRecord] = useState(null);
  const [lookupFaydaId, setLookupFaydaId] = useState('');
  const [lookupSearched, setLookupSearched] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Form states
  const [reqBloodType, setReqBloodType] = useState('O+');
  const [reqUnits, setReqUnits] = useState(1);
  const [interBloodType, setInterBloodType] = useState('O+');
  const [interUnits, setInterUnits] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [expiringBags, setExpiringBags] = useState([]);

  // HMS State
  const [hmsPatients, setHmsPatients] = useState([]);
  const [hmsOrders, setHmsOrders] = useState([]);
  const [hmsLoading, setHmsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [admitForm, setAdmitForm] = useState({ full_name: '', age: '', gender: 'male', blood_type: 'O+', fayda_id: '', ward: '', bed_number: '', diagnosis: '' });
  const [orderForm, setOrderForm] = useState({ patient_id: '', blood_type: 'O+', units_needed: 1, urgency: 'routine', notes: '' });
  const [hmsFilter, setHmsFilter] = useState('admitted');
  const [orderFulfillmentMsg, setOrderFulfillmentMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stock = await api.hospital.getStock();
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const mappedStock = bloodTypes.map(type => {
        const found = stock.find(s => s.blood_type === type);
        return {
          blood_type: type,
          quantity: found ? found.quantity : 0
        };
      });
      setInternalStock(mappedStock);

      const central = await api.hospital.getRequests();
      setRequisitions(central);

      const inter = await api.hospital.getInterHospitalRequests();
      setInterRequests(inter);

      const expiring = await api.hospital.getExpiringBags();
      setExpiringBags(Array.isArray(expiring) ? expiring : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hospital dashboard details.');
      setExpiringBags([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHmsData = async () => {
    setHmsLoading(true);
    try {
      const [patients, orders] = await Promise.all([
        api.hms.getPatients(),
        api.hms.getBloodOrders(),
      ]);
      setHmsPatients(Array.isArray(patients) ? patients : []);
      setHmsOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error('[HMS] Failed to load HMS data:', err);
    } finally {
      setHmsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 'hms') loadHmsData();
  }, [tab]);

  // WebSockets Alert Listener Configuration
  useEffect(() => {
    const socketUrl = 'http://localhost:5000';
    console.log('[WebSockets] Hospital Dashboard connecting to:', socketUrl);
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[WebSockets] Connected to WebSocket notification service!');
    });

    socket.on('h2h_updated', (data) => {
      console.log('[WebSockets] Received inter-hospital transaction broadcast:', data);
      setAlerts(prev => [
        {
          id: 'h2h-' + Date.now() + '-' + Math.random(),
          message: `📢 H2H Alert: A hospital has requested ${data.units_needed} units of ${data.blood_type}. Check H2H Board!`
        },
        ...prev
      ]);
      loadData();
    });

    socket.on('requisition_updated', (data) => {
      console.log('[WebSockets] Received warehouse central stock dispatch update:', data);
      const reqId = data.requestId || data.id || '';
      const status = data.status || '';
      setAlerts(prev => [
        {
          id: 'req-' + Date.now() + '-' + Math.random(),
          message: `✅ Requisition Alert: Order #${reqId.substring(0, 8)} status updated to "${status}".`
        },
        ...prev
      ]);
      loadData();
    });

    socket.on('expiry_warning', (data) => {
      console.log('[WebSockets] Received blood sample expiry warning broadcast:', data);
      setAlerts(prev => [
        {
          id: 'exp-' + Date.now() + '-' + Math.random(),
          message: data.message
        },
        ...prev
      ]);
    });

    socket.on('disconnect', () => {
      console.log('[WebSockets] Disconnected from notifications service.');
    });

    return () => {
      socket.disconnect();
    };
  }, []);
    const handleCreateRequisition = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.hospital.createRequisition(reqBloodType, reqUnits);
      setSuccess('Central warehouse requisition order placed successfully!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to request stock from warehouse.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.hospital.createInterHospitalRequest(interBloodType, interUnits);
      setSuccess('Emergency inter-hospital broadcast alert published successfully!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to publish emergency request.');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillInterRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.hospital.fulfillInterHospitalRequest(requestId);
      setSuccess('Direct inter-hospital stock transfer complete. Inventory successfully dispatched.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to fulfill inter-hospital transfer.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyPatientLookup = async (e) => {
    e.preventDefault();
    if (!lookupFaydaId) return;

    setLoading(true);
    setLookupError(null);
    setPatientRecord(null);
    setLookupSearched(false);

    try {
      const data = await api.hospital.emergencyPatientLookup(lookupFaydaId);
      setPatientRecord(data);
      setLookupSearched(true);
    } catch (err) {
      setLookupError(err.message || 'Patient clinical history not found in laboratory database.');
      setLookupSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Real-Time WebSocket Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              style={{ 
                background: alert.message.includes('✅') ? 'rgba(6,214,160,0.1)' : 'rgba(239,71,111,0.1)', 
                color: alert.message.includes('✅') ? '#06d6a0' : '#ef476f', 
                padding: '12px 18px', 
                borderRadius: '8px', 
                border: alert.message.includes('✅') ? '1px solid rgba(6,214,160,0.2)' : '1px solid rgba(239,71,111,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{alert.message}</span>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', padding: '0 5px' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
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
      {/* INTERNAL FACILITY STOCK */}
      {tab === 'internal' && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '3fr 2fr', gap: '30px', alignItems: 'start' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Internal Facility Blood Inventory</h3>
              </div>
              <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
                <RefreshCw size={12} /> Refresh Inventory
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
              {internalStock.map((item, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '16px', 
                  borderRadius: '8px', 
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px' }}><span className="badge-blood-type">{item.blood_type}</span></div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: item.quantity > 0 ? '#06d6a0' : 'var(--text-secondary)' }}>
                    {item.quantity}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>bags on hand</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Soon panel */}
          <div className="glass-card" style={{ border: (expiringBags || []).length > 0 ? '1px solid rgba(239,35,60,0.25)' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldAlert size={20} color={(expiringBags || []).length > 0 ? '#ef233c' : 'var(--text-secondary)'} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Expiring Soon (5 Days or Less)</h3>
            </div>

            {(expiringBags || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>No blood bags currently close to expiration.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: '#ef233c', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 4px 0' }}>
                  ⚠️ The following blood bags in your hospital's stock are close to expiration. Please prioritize usage immediately:
                </p>
                {(expiringBags || []).map((bag, idx) => {
                  const expiryDate = new Date(new Date(bag.collected_at).getTime() + 35 * 24 * 60 * 60 * 1000);
                  const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} style={{ 
                      background: 'rgba(239,35,60,0.03)', 
                      border: '1px solid rgba(239,35,60,0.12)', 
                      padding: '12px', 
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          Blood Bag ID: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{bag.id.substring(0, 8)}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Collected: {new Date(bag.collected_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge-blood-type" style={{ marginRight: '8px', padding: '3px 8px', fontSize: '0.75rem' }}>{bag.blood_type}</span>
                        <span style={{ fontSize: '0.78rem', color: '#ef233c', fontWeight: 'bold' }}>
                          {daysLeft} days left
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUISITION ORDER WORKSPACE */}
      {tab === 'central' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Order form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Requisition Dispatch Form</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Request blood bags from Central Blood Bank inventory.
            </p>

            <form onSubmit={handleCreateRequisition} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Requested Blood Type
                </label>
                <select value={reqBloodType} onChange={(e) => setReqBloodType(e.target.value)} style={{ width: '100%' }}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Units Required (Bags)
                </label>
                <input
                  type="number"
                  min="1"
                  value={reqUnits}
                  onChange={(e) => setReqUnits(parseInt(e.target.value))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                <PlusCircle size={16} /> Submit Central Requisition
              </button>
            </form>
          </div>

          {/* Submitted requisitions logs */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Requisition Order Dispatch Log</h3>
            {requisitions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No requisition orders placed yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Blood Type</th>
                      <th>Units Ordered</th>
                      <th>Order Date</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitions.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 'bold' }}>{r.blood_type}</td>
                        <td>{r.units_needed} bags</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${r.status}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
      {/* HOSPITAL TO HOSPITAL COMMUNICATION BOARD */}
      {tab === 'inter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Post transfer request */}
          <div className="glass-card" style={{ borderTop: '4px solid #8338ec' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Request Blood from Hospitals</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Submit blood request directly to other hospitals. Fulfillers can transfer stock directly from their inventories.
            </p>
            <form onSubmit={handleCreateInterRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Blood Type
                  </label>
                  <select value={interBloodType} onChange={(e) => setInterBloodType(e.target.value)} style={{ width: '100%' }}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Units Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={interUnits}
                    onChange={(e) => setInterUnits(parseInt(e.target.value))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#8338ec', borderColor: '#8338ec' }}>
                <Send size={16} /> Broadcast Transfer Request
              </button>
            </form>
          </div>

          {/* Active inter-hospital board */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Active Hospital Transfer Board</h3>
            {interRequests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No active inter-hospital blood requests on board.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Facility Requester</th>
                      <th>Blood Type</th>
                      <th>Bags</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Transfer Option</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interRequests.map(r => {
                      const availableStock = internalStock.find(s => s.blood_type === r.blood_type)?.quantity || 0;
                      const canFulfill = availableStock >= r.units_needed;

                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.requester_name}</td>
                          <td>
                            <span className="badge-blood-type">{r.blood_type}</span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{r.units_needed} units</td>
                          <td>
                            <span className={`badge badge-${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleFulfillInterRequest(r.id)}
                              className="btn btn-primary"
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '0.75rem',
                                background: canFulfill ? '#8338ec' : 'rgba(255,255,255,0.03)',
                                borderColor: canFulfill ? '#8338ec' : 'rgba(255,255,255,0.08)',
                                color: canFulfill ? '#FFF' : 'var(--text-muted)'
                              }}
                              disabled={loading || !canFulfill}
                            >
                              <Check size={12} /> Transfer Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* EMERGENCY PATIENT LOOKUP (SEPARATE LAB DATABASE RETRIEVAL) */}
      {tab === 'emergency' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ borderLeft: '4px solid #ef233c', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef233c', marginBottom: '8px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Emergency Patient Medical Lookup</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              In critical emergency scenarios, look up the donor's medical screening profile directly from the **private Laboratory Database**.
            </p>

            <form onSubmit={handleEmergencyPatientLookup} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Enter patient FAYDA ID (e.g. ET-001)"
                value={lookupFaydaId}
                onChange={(e) => setLookupFaydaId(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#ef233c', borderColor: '#ef233c' }}>
                <Search size={18} /> Query Lab Database
              </button>
            </form>
          </div>

          {lookupSearched && (
            <div className="glass-card animate-fade-in">
              {lookupError ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <AlertTriangle size={32} color="#ef233c" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', color: '#ef233c' }}>Lookup Failed</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {lookupError}
                  </p>
                </div>
              ) : patientRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      Patient Card: <strong>{patientRecord.name}</strong>
                    </h4>
                    <span className="badge-blood-type" style={{ fontSize: '1.1rem', padding: '6px 14px' }}>
                      Blood Type: {patientRecord.bloodType}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    
                    {/* Clinical vital signs */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Clinical Vitals Log</h5>
                      <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>Hemoglobin Count: <strong>{patientRecord.medicalHistory.hemoglobin}</strong></div>
                        <div>Platelet Count: <strong>{patientRecord.medicalHistory.platelets}</strong></div>
                        <div>Allergies: <strong>{patientRecord.medicalHistory.allergies}</strong></div>
                      </div>
                    </div>

                    {/* Disease screen statuses */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Lab screen Results</h5>
                      <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>Tested Markers:</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {patientRecord.medicalHistory.diseases}
                        </div>
                      </div>
                    </div>

                    {/* Patient demographics */}
                    {patientRecord.demographics && (
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Demographics</h5>
                        <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>Gender: <strong>{patientRecord.demographics.gender}</strong></div>
                          <div>Address: <strong>{patientRecord.demographics.address}</strong></div>
                          <div>Health status: <strong>{patientRecord.demographics.healthStatus}</strong></div>
                        </div>
                      </div>
                    )}

                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Laboratory Clinical Notes:</div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{patientRecord.medicalHistory.notes}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Last laboratory sync: {new Date(patientRecord.medicalHistory.lastTested).toLocaleString()}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          )}

        </div>
      )}
      </div>
      );
}
