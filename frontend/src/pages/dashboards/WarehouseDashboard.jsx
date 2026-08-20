import React, { useState, useEffect } from 'react';
import { Package, Truck, Megaphone, PlusCircle, Calendar, MapPin, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { io } from 'socket.io-client';

export default function WarehouseDashboard({ tab, setTab }) {
  const [stock, setStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('campaign'); // campaign, station
  const [annLocation, setAnnLocation] = useState('');
  const [annStart, setAnnStart] = useState('');
  const [annEnd, setAnnEnd] = useState('');

  // Emergency Alert state
  const [alertingType, setAlertingType] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [expiringBags, setExpiringBags] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stockLevels = await api.warehouse.getStock();
      // Ensure all 8 blood types are represented
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const mappedStock = bloodTypes.map(type => {
        const found = stockLevels.find(s => s.blood_type === type);
        return {
          blood_type: type,
          quantity: found ? found.quantity : 0
        };
      });
      setStock(mappedStock);

      const incoming = await api.warehouse.getRequests();
      setRequests(incoming);

      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published);

      const expiring = await api.warehouse.getExpiringBags();
      setExpiringBags(Array.isArray(expiring) ? expiring : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve inventory details.');
      setExpiringBags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
    useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('requisition_updated', (data) => {
      if (data.type === 'CREATE') {
        setAlerts(prev => [...prev, {
          id: `${data.request.id}-${Date.now()}`,
          message: `⚠️ NEW HOSPITAL REQUISITION: Hospital "${data.request.hospital_name}" has ordered ${data.request.units_needed} units of ${data.request.blood_type}!`
        }]);
        loadData();
      }
    });

    socket.on('expiry_warning', (data) => {
      setAlerts(prev => [...prev, {
        id: `${data.id}-${Date.now()}`,
        message: data.message
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFulfillRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.warehouse.fulfillRequest(requestId);
      setSuccess('Requisition order fulfilled. Stock dispatched to hospital.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to fulfill requisition.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: annTitle,
      content: annContent,
      type: annType,
      station_location: annLocation,
      start_date: annStart || undefined,
      end_date: annEnd || undefined
    };

    try {
      await api.warehouse.createAnnouncement(payload);
      setSuccess('Campaign announcement published successfully!');
      
      // Reset form
      setAnnTitle('');
      setAnnContent('');
      setAnnType('campaign');
      setAnnLocation('');
      setAnnStart('');
      setAnnEnd('');

      // Reload announcements
      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published);
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmergencyAlert = async (bloodType) => {
    setAlertingType(bloodType);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.warehouse.sendEmergencyAlert(bloodType);
      setSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to dispatch emergency alert.');
    } finally {
      setAlertingType(null);
    }
  };
}
