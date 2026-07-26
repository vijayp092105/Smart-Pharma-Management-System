// src/components/ui/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, RefreshCw, LayoutDashboard, Package, Upload, Bot, TrendingUp, Brain, AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PATIENTS, DOCTORS, DRUGS, PRESCRIPTIONS, SUPPLIERS } from '../data/pharmacy-data';
import api from '../services/api';

// ========== Local generators (kept as fallback) ==========
const getSalesTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const baseSales = months.map((month, index) => ({
    month: `${month} ${currentYear}`,
    actualSales: Math.floor(Math.random() * 5000) + 3000,
    predictedSales: Math.floor(Math.random() * 5000) + 3500,
    trend: Math.sin(index * 0.5) * 1000 + 4000
  }));
  return baseSales.map((data, index) => ({
    ...data,
    aiInsight: index > 6 ? 'Growth Phase' : 'Stabilizing',
    confidence: Math.floor(Math.random() * 30) + 70
  }));
};

const getPrescriptionsByDoctor = () => {
  const doctorPrescriptions: { [key: number]: number } = {};
  PRESCRIPTIONS.forEach(prescription => {
    doctorPrescriptions[prescription.physID] = (doctorPrescriptions[prescription.physID] || 0) + 1;
  });
  return DOCTORS.map(doctor => ({
    name: doctor.name.split(' ')[1],
    prescriptions: doctorPrescriptions[doctor.physID] || 0
  })).filter(d => d.prescriptions > 0);
};

const getExpiryTimeline = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  return months.map((month, index) => {
    const baseExpiring = Math.floor(Math.random() * 20) + 10;
    const efficiency = Math.floor((0.6 + Math.random() * 0.3) * 100);
    return {
      month: `${month} ${currentYear}`,
      expireBy: baseExpiring,
      wasted: Math.floor(baseExpiring * (0.1 + Math.random() * 0.3)),
      used: Math.floor(baseExpiring * (0.6 + Math.random() * 0.3)),
      efficiency: efficiency,
      status: efficiency > 80 ? 'Excellent' : efficiency > 60 ? 'Good' : 'Needs Attention'
    };
  });
};

const getDrugsByType = () => {
  const drugCategories = {
    'Cardiovascular': ['Lipitor', 'Zocor', 'Cozaar', 'Aldactone', 'Tenormin', 'Lasix'],
    'Analgesics': ['Motrin', 'Naprosyn', 'Tylenol'],
    'Antibiotics': ['Amoxil'],
    'Neurological': ['Neurontin', 'Ambien'],
    'Diabetes': ['Glucotrol'],
    'GI Disorders': ['Prilosec'],
    'Anti-inflammatory': ['Mobic'],
    'Other': ['Imdur', 'Plavix']
  };

  const categoryCounts: { [key: string]: number } = {};
  DRUGS.forEach(drug => {
    let categoryFound = false;
    Object.entries(drugCategories).forEach(([category, drugs]) => {
      if (drugs.includes(drug.brandName)) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        categoryFound = true;
      }
    });
    if (!categoryFound) {
      categoryCounts['Other'] = (categoryCounts['Other'] || 0) + 1;
    }
  });

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name)
  }));

  return pieData;
};

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Cardiovascular': '#00B8A9',
    'Analgesics': '#4ECDC4',
    'Antibiotics': '#FF6B6B',
    'Neurological': '#FFD166',
    'Diabetes': '#06D6A0',
    'GI Disorders': '#118AB2',
    'Anti-inflammatory': '#EF476F',
    'Other': '#9CA3AF'
  };
  return colors[category] || '#6B7280';
};

const getAIAnalysisSummary = (salesData: any[]) => {
  const totalSales = salesData.reduce((sum, item) => sum + (item.actualSales || 0), 0);
  const avgConfidence = salesData.length ? salesData.reduce((sum, item) => sum + (item.confidence || 0), 0) / salesData.length : 0;
  const growthRate = salesData.length && salesData[0].actualSales ? (((salesData[salesData.length - 1].actualSales - salesData[0].actualSales) / salesData[0].actualSales) * 100).toFixed(1) : '0.0';
  return {
    totalSales: `$${(totalSales / 1000).toFixed(1)}K`,
    avgConfidence: `${Math.round(avgConfidence)}%`,
    growthRate: `${growthRate}%`,
    peakMonth: (salesData.length ? salesData.reduce((max: any, item: any) => item.actualSales > max.actualSales ? item : max, salesData[0]).month.split(' ')[0] : ''),
    recommendation: `${growthRate.includes('-') ? 'Need marketing boost' : 'Continue strategy'}`
  };
};

const PRESCRIPTION_COLORS = [
  '#00B8A9', '#4ECDC4', '#118AB2', '#EF476F', 
  '#FFD166', '#06D6A0', '#FF6B6B', '#9CA3AF', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'
];

export default function Dashboard() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // State for API-driven data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<any[]>(() => getSalesTrend());
  const [doctorData, setDoctorData] = useState<any[]>(() => getPrescriptionsByDoctor());
  const [expiryData, setExpiryData] = useState<any[]>(() => getExpiryTimeline());
  const [drugTypeData, setDrugTypeData] = useState<any[]>(() => getDrugsByType());
  const [aiSummary, setAiSummary] = useState<any>(() => getAIAnalysisSummary(getSalesTrend()));
  const [summary, setSummary] = useState<any>(null);

  // Fetch dashboard data from backend
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      // backend shape: { success, message, data: { summary, salesTrend, prescriptionsByDoctor, expiryTimeline, drugsByType } }
      const payload = res?.data?.data ?? res?.data ?? null;

      if (payload) {
        // Use defensive mapping - fallback to local generators if keys missing
        const sales = payload.salesTrend ?? payload.sales ?? payload.salesTrendData ?? null;
        const prescriptions = payload.prescriptionsByDoctor ?? payload.prescriptions ?? payload.doctorData ?? null;
        const expiry = payload.expiryTimeline ?? payload.expiry ?? payload.expiringDrugs ?? null;
        const drugsByType = payload.drugsByType ?? payload.drugsByCategory ?? null;

        if (sales && Array.isArray(sales) && sales.length) setSalesData(sales);
        if (prescriptions && Array.isArray(prescriptions) && prescriptions.length) setDoctorData(prescriptions);
        if (expiry && Array.isArray(expiry) && expiry.length) setExpiryData(expiry);
        if (drugsByType && Array.isArray(drugsByType) && drugsByType.length) setDrugTypeData(drugsByType);

        // summary block (counts / KPIs)
        if (payload.summary) setSummary(payload.summary);
        else setSummary(null);

        // AI summary - compute or use from payload
        if (payload.aiSummary) {
          setAiSummary(payload.aiSummary);
        } else {
          setAiSummary(getAIAnalysisSummary(sales && sales.length ? sales : getSalesTrend()));
        }
      } else {
        // No payload: keep fallback data
        setAiSummary(getAIAnalysisSummary(salesData));
      }
    } catch (err: any) {
      console.error('Dashboard load error', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // expiry summary computed from expiryData (either API or fallback)
  const expirySummary = {
    totalExpiring: expiryData.reduce((sum, item) => sum + (item.expireBy || 0), 0),
    totalWasted: expiryData.reduce((sum, item) => sum + (item.wasted || 0), 0),
    totalUsed: expiryData.reduce((sum, item) => sum + (item.used || 0), 0),
    avgEfficiency: Math.round(expiryData.reduce((sum, item) => sum + (item.efficiency || 0), 0) / Math.max(1, expiryData.length))
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

        <Link to="/dashboard" className="p-3 rounded-xl bg-[#00B8A9]/20 text-[#00B8A9]" title="Dashboard">
          <LayoutDashboard className="w-7 h-7" />
        </Link>

        <Link to="/inventory" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Inventory">
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
            <h1 className="text-4xl text-gray-100" style={{ fontFamily: "'Playfair Display', serif", fontWeight: '600', letterSpacing: '0.03em' }}>
              Smart Pharma Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg shadow-lg border border-gray-600/50">
              <Calendar className="w-5 h-5 text-[#00B8A9]" />
              <span className="text-gray-200">{formattedDate}</span>
            </div>
            <button
              onClick={() => fetchDashboard()}
              className="bg-[#00B8A9] text-white p-2 rounded-lg hover:bg-[#009688] transition-colors shadow-lg"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-8 pt-8">
          <div className="bg-gradient-to-r from-[#00B8A9]/20 to-[#4ECDC4]/20 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-[#00B8A9]/30 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-[#00B8A9]" />
              <h2 className="text-2xl text-gray-100">AI Sales Analysis Summary</h2>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-3 py-8">
                <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto" />
                <div className="h-4 bg-gray-700 rounded w-2/3 mx-auto" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[200px] bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-base mb-3">Total Sales</p>
                  <p className="text-3xl text-gray-100 font-bold">{summary?.totalSales ?? aiSummary.totalSales}</p>
                  <div className="mt-3 w-16 h-1.5 bg-gradient-to-r from-[#00B8A9] to-[#4ECDC4] rounded-full"></div>
                </div>

                <div className="flex-1 min-w-[200px] bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-base mb-3">AI Confidence</p>
                  <p className="text-3xl text-[#00B8A9] font-bold">{summary?.avgConfidence ?? aiSummary.avgConfidence}</p>
                  <div className="mt-3 w-16 h-1.5 bg-gradient-to-r from-[#00B8A9] to-[#4ECDC4] rounded-full"></div>
                </div>

                <div className="flex-1 min-w-[200px] bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-base mb-3">Growth Rate</p>
                  <p className="text-3xl text-white font-bold">{summary?.growthRate ?? aiSummary.growthRate}</p>
                  <div className="mt-3 w-16 h-1.5 bg-gradient-to-r from-[#00B8A9] to-[#4ECDC4] rounded-full"></div>
                </div>

                <div className="flex-1 min-w-[200px] bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-base mb-3">Peak Month</p>
                  <p className="text-3xl text-gray-100 font-bold">{summary?.peakMonth ?? aiSummary.peakMonth}</p>
                  <div className="mt-3 w-16 h-1.5 bg-gradient-to-r from-[#00B8A9] to-[#4ECDC4] rounded-full"></div>
                </div>

                <div className="flex-1 min-w-[200px] bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-base mb-3">AI Recommendation</p>
                  <p className="text-3xl text-gray-100 font-bold text-center px-2">{summary?.recommendation ?? aiSummary.recommendation}</p>
                  <div className="mt-3 w-16 h-1.5 bg-gradient-to-r from-[#00B8A9] to-[#4ECDC4] rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {error && <div className="mb-4 text-red-400 text-center">{error}</div>}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00B8A9]" />
                  Sales Trend of Drugs (AI Analysis)
                </h2>
                <span className="px-3 py-1 bg-[#00B8A9]/20 text-[#00B8A9] text-sm rounded-full">AI Predictive</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B8A9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00B8A9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }} />
                  <Area type="monotone" dataKey="actualSales" stroke="#00B8A9" fillOpacity={1} fill="url(#colorSales)" name="Actual Sales" />
                  <Area type="monotone" dataKey="predictedSales" stroke="#4ECDC4" fillOpacity={0.3} fill="url(#colorPredicted)" name="Predicted Sales" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
              <h2 className="mb-4 text-gray-100">Prescriptions by Doctor</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                      border: '1px solid #374151', 
                      borderRadius: '8px', 
                      color: '#FFFFFF',
                      backdropFilter: 'blur(10px)'
                    }} 
                    formatter={(value) => [value, 'Prescriptions']}
                    itemStyle={{ color: '#FFFFFF' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="prescriptions" radius={[8, 8, 0, 0]}>
                    {doctorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRESCRIPTION_COLORS[index % PRESCRIPTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="lg:w-2/3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                      Drug Expiry Timeline
                    </h2>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ef4444] rounded-full"></div><span className="text-gray-400 text-sm">Expire By</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#f59e0b] rounded-full"></div><span className="text-gray-400 text-sm">Wasted</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#10b981] rounded-full"></div><span className="text-gray-400 text-sm">Used</span></div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={expiryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }} />
                      <Line type="monotone" dataKey="expireBy" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, fill: '#ef4444' }} name="Expire By" />
                      <Line type="monotone" dataKey="wasted" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} name="Wasted" />
                      <Line type="monotone" dataKey="used" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="Used" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:w-1/3">
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 h-full">
                    <h3 className="text-gray-300 mb-4 text-center">Expiry Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                          <span className="text-gray-300 text-sm">Total Expiring</span>
                        </div>
                        <span className="text-gray-100 font-bold">{expirySummary.totalExpiring}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-[#f59e0b] rounded-full"></div>
                          <span className="text-gray-300 text-sm">Total Wasted</span>
                        </div>
                        <span className="text-gray-100 font-bold">{expirySummary.totalWasted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                          <span className="text-gray-300 text-sm">Total Used</span>
                        </div>
                        <span className="text-gray-100 font-bold">{expirySummary.totalUsed}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 text-sm">Efficiency Rate</span>
                          <span className="text-gray-100 font-bold">{expirySummary.avgEfficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#10b981]" style={{ width: `${expirySummary.avgEfficiency}%` }} />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-700/50">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1">Recommendation</p>
                          <p className="text-gray-200 text-sm font-medium">
                            {expirySummary.avgEfficiency > 80 ? '✅ Excellent utilization' : expirySummary.avgEfficiency > 60 ? '⚠️ Monitor waste levels' : '❌ Review expiry management'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
              <h2 className="mb-4 text-gray-100">Drugs by Therapeutic Category</h2>
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full md:w-2/3 lg:w-1/2 mb-6 md:mb-0 md:pr-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={drugTypeData} cx="50%" cy="50%" labelLine={false} label={({ name }) => name} outerRadius={90} innerRadius={45} paddingAngle={2} dataKey="value">
                        {drugTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px', 
                          color: '#FFFFFF'
                        }} 
                        formatter={(value, name) => [`${value} drugs`, name]}
                        itemStyle={{ color: '#FFFFFF' }}
                        labelStyle={{ color: '#FFFFFF' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/3 lg:w-1/2">
                  <div className="h-full">
                    <h3 className="text-gray-300 mb-4 text-center md:text-left">Categories</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {drugTypeData.map((category, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: category.color }}></div>
                          <span className="text-gray-300 text-sm truncate">{category.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                      <p className="text-gray-400 text-sm text-center">Hover over pie slices to see drug counts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/upload-csv">
              <button className="bg-[#00B8A9] text-white px-8 py-3 rounded-xl hover:bg-[#009688] transition-all shadow-lg hover:shadow-xl">
                To get live data: Upload Data (Excel files)
              </button>
            </Link>
          </div>
        </div>

        <div className="text-center py-6 text-gray-400 text-sm">Made by Straw Hat Crew (PEC)</div>
      </div>
    </div>
  );
}