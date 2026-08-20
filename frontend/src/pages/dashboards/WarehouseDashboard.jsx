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
}
