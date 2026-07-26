// src/components/ui/UploadCSV.tsx
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Package, Upload, Bot, FileSpreadsheet, X } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api'; // <- axios client (must exist)

// Import pharmacy data functions to update the data (kept as fallback)
import {
  PATIENTS,
  DOCTORS,
  DRUGS,
  SUPPLIERS,
  PRESCRIPTIONS,
  INSURANCE
} from '../data/pharmacy-data';

// Define file type
type UploadedFile = {
  name: string;
  type: string;
  size: number;
  content?: any[];
  lastModified: number;
  fileObj?: File; // store real File object for upload
};

// Expected file structure for each type
const FILE_TYPES = [
  {
    name: 'patients',
    displayName: 'Patients',
    expectedColumns: ['firstName', 'lastName', 'birthdate', 'address', 'phone', 'gender', 'insurance', 'patientID'],
    icon: '👤'
  },
  {
    name: 'doctors',
    displayName: 'Doctors',
    expectedColumns: ['physID', 'name', 'address', 'phone'],
    icon: '👨‍⚕️'
  },
  {
    name: 'drugs',
    displayName: 'Drugs',
    expectedColumns: ['brandName', 'genericName', 'NDC', 'dosage', 'expDate', 'supID', 'purchasePrice', 'sellPrice'],
    icon: '💊'
  },
  {
    name: 'supplier',
    displayName: 'Supplier',
    expectedColumns: ['supID', 'name', 'address', 'phone'],
    icon: '🏢'
  },
  {
    name: 'prescriptions',
    displayName: 'Prescriptions',
    expectedColumns: ['patientID', 'physID', 'NDC', 'qty', 'days', 'refills', 'status'],
    icon: '📋'
  },
  {
    name: 'insurance',
    displayName: 'Insurance',
    expectedColumns: ['name', 'phone', 'coPay'],
    icon: '🛡️'
  }
];

export default function UploadCSV() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (open native file dialog)
  const handleFileSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process selected files and save File objects for upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        setShowError('Only Excel (.xlsx, .xls) and CSV files are allowed');
        return;
      }

      // Push with real File object for later upload
      newFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        fileObj: file
      });
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setShowError('');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a file from list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fallback parser simulation (kept for offline/demo)
  const parseFileContent = (fileName: string): any[] => {
    const fileType = fileName.toLowerCase();
    let mockData = [];

    if (fileType.includes('patient')) {
      mockData = PATIENTS.slice(0, 3).map(p => ({ ...p }));
    } else if (fileType.includes('doctor')) {
      mockData = DOCTORS.slice(0, 2).map(d => ({ ...d }));
    } else if (fileType.includes('drug')) {
      mockData = DRUGS.slice(0, 5).map(d => ({ ...d }));
    } else if (fileType.includes('supplier')) {
      mockData = SUPPLIERS.map(s => ({ ...s }));
    } else if (fileType.includes('prescription')) {
      mockData = PRESCRIPTIONS.slice(0, 4).map(p => ({ ...p }));
    } else if (fileType.includes('insurance')) {
      mockData = INSURANCE.map(i => ({ ...i }));
    } else {
      mockData = [
        { id: 1, name: 'Sample Data 1', value: 'Test Value 1' },
        { id: 2, name: 'Sample Data 2', value: 'Test Value 2' },
        { id: 3, name: 'Sample Data 3', value: 'Test Value 3' }
      ];
    }

    return mockData;
  };

  // Upload files to backend (real implementation)
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setShowError('Please select at least one file to upload');
      return;
    }

    // If any file object is missing, fallback to simulated processing
    const hasFileObjects = uploadedFiles.every(f => !!f.fileObj);

    setIsUploading(true);
    setShowError('');
    setServerMessage(null);

    try {
      if (hasFileObjects) {
        // Build form data
        const form = new FormData();
        uploadedFiles.forEach((f) => {
          if (f.fileObj) form.append('file', f.fileObj);
        });

        // Optionally add metadata (e.g., uploader, uploadTime)
        form.append('uploadedBy', 'web-ui');
        form.append('uploadTime', new Date().toISOString());

        // Post to backend: POST /api/upload
        const resp = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Backend expected to return { success, message, data? }
        const message = resp?.data?.message ?? 'Upload completed';
        setServerMessage(typeof message === 'string' ? message : JSON.stringify(message));
        setShowSuccess(true);

      } else {
        // Fallback: simulate parsing if File objects not present
        await new Promise(resolve => setTimeout(resolve, 1200));
        const processedData: Record<string, any[]> = {};

        uploadedFiles.forEach(file => {
          const data = parseFileContent(file.name);
          const fileType = FILE_TYPES.find(type => file.name.toLowerCase().includes(type.name.toLowerCase()))?.name || 'unknown';
          if (!processedData[fileType]) processedData[fileType] = [];
          processedData[fileType].push(...data);
        });

        // simulate server response
        setServerMessage('Simulated upload complete (offline mode)');
        setShowSuccess(true);
      }

      // Clear uploaded files list after success
      setUploadedFiles([]);
      window.dispatchEvent(new Event('dataUpdated'));
      setTimeout(() => setShowSuccess(false), 4500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setShowError(err?.response?.data?.error ?? err?.message ?? 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

        <Link to="/inventory" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Inventory">
          <Package className="w-7 h-7" />
        </Link>

        <Link to="/upload-csv" className="p-3 rounded-xl bg-[#00B8A9]/20 text-[#00B8A9]" title="Upload CSV">
          <Upload className="w-7 h-7" />
        </Link>

        <Link to="/assistant" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Assistant">
          <Bot className="w-7 h-7" />
        </Link>
      </div>

      {/* Success / Error */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <p className="text-center">Upload successful{serverMessage ? ` — ${serverMessage}` : ''}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showError && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-8 py-4 rounded-xl shadow-2xl"
          >
            <p className="text-center">{showError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-20 relative z-10">
        <div className="bg-gray-800/90 backdrop-blur-md shadow-2xl px-8 py-6 flex justify-between items-center border-b border-gray-700/50">
          <div>
            <h1 className="text-4xl text-gray-100" style={{ fontFamily: "'Playfair Display', serif", fontWeight: '600', letterSpacing: '0.03em' }}>
              Upload CSV/Excel Files
            </h1>
            <p className="text-gray-400 mt-2">Upload pharmacy data files to update dashboard charts and inventory</p>
          </div>
        </div>

        <div className="p-8 flex items-center justify-center min-h-[80vh]">
          <div className="max-w-4xl w-full">
            <div className="mb-8">
              <h2 className="text-xl text-gray-200 mb-4">Supported File Types</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {FILE_TYPES.map((fileType) => (
                  <div key={fileType.name} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{fileType.icon}</span>
                      <div>
                        <h3 className="text-gray-200">{fileType.displayName}</h3>
                        <p className="text-gray-400 text-sm">{fileType.expectedColumns.length} columns expected</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden file input */}
            <div className="absolute -left-[9999px] -top-[9999px] opacity-0 w-0 h-0 overflow-hidden">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: 'none' }}
                aria-hidden
              />
            </div>

            <div
              onClick={(e) => handleFileSelect(e)}
              className="border-4 border-dashed border-[#00B8A9] rounded-2xl p-12 mb-6 cursor-pointer hover:border-[#4ECDC4] transition-all bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/70 group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' ? handleFileSelect(e as any) : null)}
              aria-label="File upload area. Click to select Excel or CSV files"
            >
              {uploadedFiles.length === 0 ? (
                <div className="text-center">
                  <Upload className="w-20 h-20 mx-auto mb-4 text-[#00B8A9] group-hover:scale-110 transition-transform" />
                  <p className="text-gray-200 text-xl mb-2">Click to select files or drag and drop</p>
                  <p className="text-gray-400">Supports: .xlsx, .xls, .csv files</p>
                  <p className="text-gray-400 text-sm mt-2">Max file size: 10MB each</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-gray-200 text-xl mb-4">Selected Files ({uploadedFiles.length})</h3>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between bg-gray-700/60 p-4 rounded-lg shadow-sm border border-gray-600/50 hover:bg-gray-700/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileSpreadsheet className="w-8 h-8 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 truncate">{file.name}</p>
                          <p className="text-gray-400 text-sm">
                            {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="p-2 hover:bg-gray-600/50 rounded-full transition-colors"
                        title="Remove file"
                        type="button"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <p className="text-gray-400">Click anywhere in this area to add more files</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {uploadedFiles.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`bg-[#008C52] text-white px-12 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#007544]'}`}
                    type="button"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Files...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload {uploadedFiles.length} File{uploadedFiles.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
                <h3 className="text-gray-200 mb-3">How it works:</h3>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-start gap-2"><span className="text-[#00B8A9]">1.</span><span>Click the dotted area or drag & drop Excel/CSV files</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#00B8A9]">2.</span><span>Selected files will appear in the upload area</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#00B8A9]">3.</span><span>Click the Upload button to send files to the backend</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#00B8A9]">4.</span><span>Data will automatically update in Inventory and Dashboard charts</span></li>
                </ul>
                {serverMessage && <p className="text-gray-300 mt-4">Server: {serverMessage}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-6 text-gray-400 text-sm">Made by Straw Hat Crew (PEC)</div>
      </div>
    </div>
  );
}
