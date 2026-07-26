import React, { useState } from 'react';
import { Upload as UploadIcon, FileCheck, AlertCircle, FileText, CheckCircle, Database } from 'lucide-react';
import axios from 'axios';

const FILE_TYPES = [
  { id: 'doctors', label: 'Doctors Directory', icon: <Database /> },
  { id: 'drugs', label: 'Drug Inventory', icon: <FileText /> },
  { id: 'insurance', label: 'Insurance Providers', icon: <FileText /> },
  { id: 'patient', label: 'Patient Database', icon: <Database /> },
  { id: 'prescriptions', label: 'Rx Records', icon: <FileText /> },
  { id: 'supplier', label: 'Supplier List', icon: <Database /> }
];

const UploadPage = () => {
  const [status, setStatus] = useState({}); // { [type]: 'success' | 'error' | 'loading' }

  const handleUpload = async (type, file) => {
    setStatus(prev => ({ ...prev, [type]: 'loading' }));
    try {
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a .csv file');
        setStatus(prev => ({ ...prev, [type]: null }));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`http://localhost:5000/api/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus(prev => ({ ...prev, [type]: 'success' }));
    } catch (err) {
      console.error(err);
      setStatus(prev => ({ ...prev, [type]: 'error' }));
      alert(`Upload Failed. Please check the CSV format.`);
    }
  };

  return (
    <div className="page-content">
      {/* Liquid Header */}
      <header className="liquid-header">
        <h1 className="liquid-title">Data Ingestion</h1>
        <div className="liquid-subtitle">
          <UploadIcon size={16} />
          <span>Import CSV Records</span>
        </div>
      </header>

      {/* Upload Grid */}
      <div className="glass-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {FILE_TYPES.map(type => (
          <label
            key={type.id}
            className={`glass-card upload-card ${status[type.id]}`}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '220px',
              border: status[type.id] === 'success' ? '1px solid #34d399' : status[type.id] === 'error' ? '1px solid #f87171' : undefined
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files[0] && handleUpload(type.id, e.target.files[0])}
              hidden
            />

            <div className={`upload-icon-wrapper ${status[type.id]}`}>
              {status[type.id] === 'success' ? <CheckCircle size={32} /> :
                status[type.id] === 'error' ? <AlertCircle size={32} /> :
                  status[type.id] === 'loading' ? <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div> : type.icon}
            </div>

            <h3 style={{ margin: '1rem 0 0.5rem 0' }}>{type.label}</h3>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
              {status[type.id] === 'success' ? 'New expiry alerts detected' :
                status[type.id] === 'error' ? 'Sync Failed' :
                  status[type.id] === 'loading' ? 'Uploading...' : 'Click to Upload CSV'}
            </p>

            {status[type.id] === 'success' && <div className="glow-success"></div>}
          </label>
        ))}
      </div>
    </div>
  );
};

export default UploadPage;
