// src/components/ui/Inventory.tsx
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Package, Upload, Bot, Search, Calendar, RefreshCw, Filter } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { PATIENTS, DOCTORS, DRUGS, SUPPLIERS, PRESCRIPTIONS, INSURANCE } from '../data/pharmacy-data';
import api from '../services/api';

// Dataset definitions (keeps your icons/text)
const DATASETS = [
  { id: 'patients', name: 'Patients', icon: '👤' },
  { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️' },
  { id: 'drugs', name: 'Drugs', icon: '💊' },
  { id: 'supplier', name: 'Supplier', icon: '🏢' }, // note: UI id 'supplier'
  { id: 'prescriptions', name: 'Prescriptions', icon: '📋' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' }
];

// Helpers for expiry checks (kept from your original file)
const parseExp = (expDateStr: string) => {
  const [monthStr = 'Jan', yearStr = '70'] = expDateStr.split('-');
  const monthAbbr = monthStr.slice(0, 3).toLowerCase();
  const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  const month = monthMap[monthAbbr] ?? 0;
  const year = 2000 + (parseInt(yearStr) || 0);
  const expirationDate = new Date(year, month + 1, 0);
  return { month, year, expirationDate };
};

const isDrugExpiredOrCurrentMonth = (expDateStr: string, currentDate: Date): boolean => {
  const { month, year, expirationDate } = parseExp(expDateStr);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;
  return expirationDate < currentDate || isCurrentMonth;
};

const isDrugExpiringSoon = (expDateStr: string, currentDate: Date): boolean => {
  const { month, year } = parseExp(expDateStr);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  if (year > currentYear) return true;
  if (year === currentYear && month > currentMonth) return true;
  return false;
};

// Supplier ID mapping function: backend IDs (17, 18) -> display IDs (1, 2)
const mapSupplierIdForDisplay = (supplierId: any): string => {
  const id = Number(supplierId);
  if (id === 17) return '1';
  if (id === 18) return '2';
  return String(supplierId || '');
};

// Supplier ID mapping for filter: check if backend ID corresponds to display filter
const mapSupplierIdForFilter = (supplierId: any, filterValue: string): boolean => {
  const id = Number(supplierId);
  if (filterValue === 'supplier1') return id === 17; // Backend 17 = Display 1
  if (filterValue === 'supplier2') return id === 18; // Backend 18 = Display 2
  return true;
};

// Map UI dataset id -> backend dataset name (adjust if your backend uses different slugs)
const datasetToEndpoint = (datasetId: string) => {
  switch (datasetId) {
    case 'supplier': return 'suppliers'; // backend likely expects plural
    default: return datasetId; // e.g., 'drugs', 'patients', 'doctors', 'prescriptions', 'insurance'
  }
};

export default function Inventory() {
  const [selectedDataset, setSelectedDataset] = useState<string>('drugs');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBy, setFilterBy] = useState<string>('all');

  // Remote-fetched lists (raw)
  const [rawData, setRawData] = useState<any[]>([]);
  // Filtered / displayed lists (after applying search/filter)
  const [filteredDrugs, setFilteredDrugs] = useState<any[]>(DRUGS);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>(PRESCRIPTIONS);
  const [filteredPatients, setFilteredPatients] = useState<any[]>(PATIENTS);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>(DOCTORS);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>(SUPPLIERS);
  const [filteredInsurance, setFilteredInsurance] = useState<any[]>(INSURANCE);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // Fetch dataset from backend
  const fetchDataset = useCallback(async (datasetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = datasetToEndpoint(datasetId);
      const res = await api.get(`/inventory/${endpoint}`, {
        params: { search: '' } // we fetch raw, will apply search locally to preserve your filters
      });
      // backend shapes vary; robust read:
      const payload = res?.data?.data ?? res?.data ?? null;
      // payload might be { data: [...], total, page, totalPages } or an array directly
      const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      // If we didn't get rows but the backend returned a non-empty object, try to treat payload as rows
      const finalRows = rows.length ? rows : (Array.isArray(payload) ? payload : []);

      setRawData(finalRows);

      // Initialize the displayed lists with fetched rows (or keep fallback local dataset if empty)
      if (datasetId === 'drugs') setFilteredDrugs(finalRows.length ? finalRows : DRUGS);
      if (datasetId === 'prescriptions') setFilteredPrescriptions(finalRows.length ? finalRows : PRESCRIPTIONS);
      if (datasetId === 'patients') setFilteredPatients(finalRows.length ? finalRows : PATIENTS);
      if (datasetId === 'doctors') setFilteredDoctors(finalRows.length ? finalRows : DOCTORS);
      if (datasetId === 'supplier') setFilteredSuppliers(finalRows.length ? finalRows : SUPPLIERS);
      if (datasetId === 'insurance') setFilteredInsurance(finalRows.length ? finalRows : INSURANCE);

    } catch (err: any) {
      console.error('Failed to fetch dataset', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load dataset from server');
      // Keep previous / fallback data when error occurs
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when dataset changes
  useEffect(() => {
    fetchDataset(selectedDataset);
    // reset UI filters/search when switching
    setFilterBy('all');
    setSearchTerm('');
  }, [selectedDataset, fetchDataset]);

  // Apply search & filter to the current dataset client-side (keeps your original behavior)
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    if (selectedDataset === 'drugs') {
      let list = Array.isArray(rawData) && rawData.length ? rawData.slice() : DRUGS.slice();

      if (term) {
        list = list.filter((drug:any) => {
          const brand = (drug.brandName || drug.brand_name || '').toString().toLowerCase();
          const generic = (drug.genericName || drug.generic_name || '').toString().toLowerCase();
          const ndc = (drug.NDC || drug.ndc || drug.ndc_code || '').toString().toLowerCase();
          return brand.includes(term) || generic.includes(term) || ndc.includes(term);
        });
      }

      if (filterBy !== 'all') {
        list = list.filter((drug:any) => {
          const expDate = drug.expDate || drug.expiryDate || drug.expiry_date || '';
          const supID = drug.supID ?? drug.supplier_id ?? drug.supplierId ?? drug.supplier?.id;
          // Use the mapping function for filter checks
          if (filterBy === 'supplier1' || filterBy === 'supplier2') {
            return mapSupplierIdForFilter(supID, filterBy);
          }
          if (filterBy === 'expired') return expDate ? isDrugExpiredOrCurrentMonth(expDate, today) : false;
          if (filterBy === 'expiringSoon') return expDate ? isDrugExpiringSoon(expDate, today) : false;
          return true;
        });
      }

      setFilteredDrugs(list);
    } else if (selectedDataset === 'prescriptions') {
      let list = Array.isArray(rawData) && rawData.length ? rawData.slice() : PRESCRIPTIONS.slice();

      if (term) {
        list = list.filter((p:any) => {
          const ndc = (p.NDC || p.ndc || '').toString().toLowerCase();
          const pid = (p.patientID || p.patient_id || '').toString().toLowerCase();
          return ndc.includes(term) || pid.includes(term);
        });
      }

      if (filterBy !== 'all') {
        list = list.filter((p:any) => {
          const status = (p.status || '').toString().toLowerCase();
          if (filterBy === 'pickedUp') return status === 'picked up';
          if (filterBy === 'filled') return status === 'filled';
          if (filterBy === 'pending') return !status || status === '';
          if (filterBy === 'withRefills') return (p.refills || p.refill_count || 0) > 0;
          return true;
        });
      }

      setFilteredPrescriptions(list);
    } else if (selectedDataset === 'patients') {
      // use either rawData or local fallbacks
      const list = Array.isArray(rawData) && rawData.length ? rawData : PATIENTS;
      setFilteredPatients(list.filter((patient:any) => {
        if (!term) return true;
        const first = (patient.firstName || patient.first_name || '').toLowerCase();
        const last = (patient.lastName || patient.last_name || '').toLowerCase();
        return first.includes(term) || last.includes(term) || (patient.patientID || '').toString().includes(term) || (patient.phone || '').includes(term) || (patient.insurance || '').toLowerCase().includes(term);
      }));
    } else if (selectedDataset === 'doctors') {
      const list = Array.isArray(rawData) && rawData.length ? rawData : DOCTORS;
      setFilteredDoctors(list.filter((d:any) => {
        if (!term) return true;
        const name = (d.name || '').toLowerCase();
        return name.includes(term) || (d.physID || '').toString().includes(term) || (d.phone || '').includes(term);
      }));
    } else if (selectedDataset === 'supplier') {
      const list = Array.isArray(rawData) && rawData.length ? rawData : SUPPLIERS;
      setFilteredSuppliers(list.filter((s:any) => {
        if (!term) return true;
        const name = (s.name || '').toLowerCase();
        return name.includes(term) || (s.supID || '').toString().includes(term) || (s.phone || '').includes(term);
      }));
    } else if (selectedDataset === 'insurance') {
      const list = Array.isArray(rawData) && rawData.length ? rawData : INSURANCE;
      setFilteredInsurance(list.filter((ins:any) => {
        if (!term) return true;
        return (ins.name || '').toLowerCase().includes(term) || (ins.phone || '').includes(term);
      }));
    }
  }, [searchTerm, filterBy, selectedDataset, rawData, today]);

  // Refresh handler
  const onRefresh = () => fetchDataset(selectedDataset);

  // Render table content (keeps your original JSX but reads from the state updated above)
  const renderTableContent = () => {
    if (loading) {
      return <div className="p-6 text-center text-gray-400">Loading...</div>;
    }
    if (error) {
      return <div className="p-6 text-center text-red-400">Error: {error}</div>;
    }

    if (selectedDataset === 'drugs') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Brand Name</th>
                <th className="px-4 py-3 text-left">Generic Name</th>
                <th className="px-4 py-3 text-left">NDC</th>
                <th className="px-4 py-3 text-left">Dosage</th>
                <th className="px-4 py-3 text-left">Exp Date</th>
                <th className="px-4 py-3 text-left">Supplier ID</th>
                <th className="px-4 py-3 text-left">Purchase Price</th>
                <th className="px-4 py-3 text-left">Sell Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.map((drug, index) => {
                const rawSupplierId = drug.supID ?? drug.supplier_id ?? drug.supplierId ?? drug.supplier?.id;
                const displaySupplierId = mapSupplierIdForDisplay(rawSupplierId);
                
                return (
                  <tr key={drug.id ?? drug.NDC ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                    <td className="px-4 py-3 text-gray-200">{drug.brandName ?? drug.brand_name}</td>
                    <td className="px-4 py-3 text-gray-200">{drug.genericName ?? drug.generic_name}</td>
                    <td className="px-4 py-3 text-gray-200">{drug.NDC ?? drug.ndc}</td>
                    <td className="px-4 py-3 text-gray-200">{drug.dosage}</td>
                    <td className="px-4 py-3 text-gray-200">{drug.expDate ?? drug.expiryDate ?? drug.expiry_date}</td>
                    <td className="px-4 py-3 text-gray-200">{displaySupplierId}</td>
                    <td className="px-4 py-3 text-gray-200">${Number(drug.purchasePrice ?? drug.purchase_price ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-200">${Number(drug.sellPrice ?? drug.selling_price ?? drug.sellingPrice ?? 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedDataset === 'patients') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Patient ID</th>
                <th className="px-4 py-3 text-left">First Name</th>
                <th className="px-4 py-3 text-left">Last Name</th>
                <th className="px-4 py-3 text-left">Birthdate</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">Insurance</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient: any, index: number) => (
                <tr key={patient.id ?? patient.patientID ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                  <td className="px-4 py-3 text-gray-200">{patient.patientID ?? patient.patient_id}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.firstName ?? patient.first_name}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.lastName ?? patient.last_name}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.birthdate}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.address}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.phone}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.gender ?? 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-200">{patient.insurance ?? 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedDataset === 'doctors') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Phys ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor: any, index: number) => (
                <tr key={doctor.id ?? doctor.physID ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                  <td className="px-4 py-3 text-gray-200">{doctor.physID ?? doctor.phys_id}</td>
                  <td className="px-4 py-3 text-gray-200">{doctor.name}</td>
                  <td className="px-4 py-3 text-gray-200">{doctor.address}</td>
                  <td className="px-4 py-3 text-gray-200">{doctor.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedDataset === 'supplier') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Supplier ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier: any, index: number) => (
                <tr key={supplier.id ?? supplier.supID ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                  <td className="px-4 py-3 text-gray-200">{supplier.supID ?? supplier.sup_id}</td>
                  <td className="px-4 py-3 text-gray-200">{supplier.name}</td>
                  <td className="px-4 py-3 text-gray-200">{supplier.address}</td>
                  <td className="px-4 py-3 text-gray-200">{supplier.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedDataset === 'prescriptions') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Patient ID</th>
                <th className="px-4 py-3 text-left">Phys ID</th>
                <th className="px-4 py-3 text-left">NDC</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Days</th>
                <th className="px-4 py-3 text-left">Refills</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.map((prescription: any, index: number) => (
                <tr key={prescription.id ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                  <td className="px-4 py-3 text-gray-200">{prescription.patientID ?? prescription.patient_id}</td>
                  <td className="px-4 py-3 text-gray-200">{prescription.physID ?? prescription.phys_id}</td>
                  <td className="px-4 py-3 text-gray-200">{prescription.NDC ?? prescription.ndc}</td>
                  <td className="px-4 py-3 text-gray-200">{prescription.qty ?? prescription.quantity}</td>
                  <td className="px-4 py-3 text-gray-200">{prescription.days}</td>
                  <td className="px-4 py-3 text-gray-200">{prescription.refills}</td>
                  <td className="px-4 py-3 text-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      (prescription.status || '').toLowerCase() === 'picked up' ? 'bg-green-500/20 text-green-300' : 
                      (prescription.status || '').toLowerCase() === 'filled' ? 'bg-blue-500/20 text-blue-300' : 
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {prescription.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedDataset === 'insurance') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#00B8A9] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Co-Pay</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsurance.map((insurance: any, index: number) => (
                <tr key={insurance.id ?? index} className={index % 2 === 0 ? 'bg-gray-700/40' : 'bg-gray-800/40'}>
                  <td className="px-4 py-3 text-gray-200">{insurance.name}</td>
                  <td className="px-4 py-3 text-gray-200">{insurance.phone}</td>
                  <td className="px-4 py-3 text-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      (insurance.coPay || insurance.co_pay) === 'Yes' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {insurance.coPay || insurance.co_pay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const renderFilterDropdown = () => {
    if (selectedDataset === 'drugs') {
      return (
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00B8A9] text-sm"
        >
          <option value="all">All Drugs</option>
          <option value="supplier1">Supplier 1 (Cardinal)</option>
          <option value="supplier2">Supplier 2 (McKesson)</option>
          <option value="expired">Expired (Incl. Current Month)</option>
          <option value="expiringSoon">Expiring Soon (After Current Month)</option>
        </select>
      );
    } else if (selectedDataset === 'prescriptions') {
      return (
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00B8A9] text-sm"
        >
          <option value="all">All Prescriptions</option>
          <option value="pickedUp">Picked Up</option>
          <option value="filled">Filled</option>
          <option value="pending">Pending</option>
          <option value="withRefills">With Refills</option>
        </select>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-[#00B8A9] opacity-5"
            style={{
              left: `${(i % 10) * 10 + 5}%`,
              top: `${Math.floor(i / 10) * 12 + 2}%`,
              fontSize: '28px'
            }}
          >
            {i % 4 === 0 ? '💊' : i % 4 === 1 ? '⚕️' : i % 4 === 2 ? '🏥' : '⚕'}
          </div>
        ))}
      </div>

      <div className="fixed left-0 top-0 h-screen w-20 bg-gray-800/90 backdrop-blur-md shadow-2xl z-20 flex flex-col items-center py-8 gap-6 border-r border-gray-700/50">
        <Link to="/" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Home">
          <Home className="w-7 h-7" />
        </Link>
        
        <Link to="/dashboard" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Dashboard">
          <LayoutDashboard className="w-7 h-7" />
        </Link>
        
        <Link to="/inventory" className="p-3 rounded-xl bg-[#00B8A9]/20 text-[#00B8A9]" title="Inventory">
          <Package className="w-7 h-7" />
        </Link>
        
        <Link to="/upload-csv" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Upload CSV">
          <Upload className="w-7 h-7" />
        </Link>
        
        <Link to="/assistant" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Assistant">
          <Bot className="w-7 h-7" />
        </Link>
      </div>

      <div className="ml-20 relative z-10">
        <div className="bg-gray-800/90 backdrop-blur-md shadow-2xl px-8 py-6 flex justify-between items-center border-b border-gray-700/50">
          <div>
            <h1 
              className="text-4xl text-gray-100"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: '600', letterSpacing: '0.03em' }}
            >
              Inventory
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg shadow-lg border border-gray-600/50">
              <Calendar className="w-5 h-5 text-[#00B8A9]" />
              <span className="text-gray-200">{formattedDate}</span>
            </div>
            <button onClick={onRefresh} className="bg-[#00B8A9] text-white p-2 rounded-lg hover:bg-[#009688] transition-colors shadow-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-6 gap-4 mb-8">
            {DATASETS.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => setSelectedDataset(dataset.id)}
                className={`p-4 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105 border ${
                  selectedDataset === dataset.id
                    ? 'bg-[#00B8A9] text-white border-[#00B8A9]'
                    : 'bg-gray-800/60 text-gray-300 border-gray-700/50 hover:bg-gray-700/60'
                }`}
              >
                <div className="text-4xl mb-2">{dataset.icon}</div>
                <div className="text-sm">{dataset.name}</div>
              </button>
            ))}
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-100 capitalize">{selectedDataset} Data</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B8A9] text-gray-200"
                  />
                </div>
                
                {(selectedDataset === 'drugs' || selectedDataset === 'prescriptions') && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-[#00B8A9]" />
                    {renderFilterDropdown()}
                  </div>
                )}
              </div>
            </div>

            {renderTableContent()}
          </div>
        </div>

        <div className="text-center py-6 text-gray-400 text-sm">
          Made by Straw Hat Crew (PEC)
        </div>
      </div>
    </div>
  );
}