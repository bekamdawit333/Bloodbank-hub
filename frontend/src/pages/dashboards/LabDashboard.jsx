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
}
