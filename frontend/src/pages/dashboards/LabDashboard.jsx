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
}
