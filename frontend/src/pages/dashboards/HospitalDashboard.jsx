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
}
