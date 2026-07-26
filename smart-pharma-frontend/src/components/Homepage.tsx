// src/components/ui/Homepage.tsx
import { Bell, LayoutDashboard, Package, Upload, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { DRUGS } from '../data/pharmacy-data';
import api from '../services/api';

export default function Homepage() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [expiredMedicines, setExpiredMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: convert your backend item to expected UI fields
  const normalizeBackendDrug = (d: any) => {
    // backend might return brand_name/generic_name/expiry_date or brandName/genericName/expDate
    return {
      brandName: d.brandName ?? d.brand_name ?? d.name ?? d.brand,
      genericName: d.genericName ?? d.generic_name ?? d.generic,
      NDC: d.NDC ?? d.ndc ?? d.ndc_code,
      expDate: d.expDate ?? d.expiryDate ?? d.expiry_date ?? d.expDateStr ?? d.exp_date,
      raw: d
    };
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/dashboard');
        // defensive extraction — backend may wrap differently
        const payload = res?.data?.data ?? res?.data ?? null;

        // common keys we look for:
        // payload.expiringDrugs OR payload.expiryTimeline OR payload.expiring OR payload.expiry
        let items: any[] = [];

        if (payload) {
          if (Array.isArray(payload.expiringDrugs) && payload.expiringDrugs.length) {
            items = payload.expiringDrugs;
          } else if (Array.isArray(payload.expiryTimeline) && payload.expiryTimeline.length) {
            // sometimes expiryTimeline may be aggregated — try to flatten if necessary
            items = payload.expiryTimeline;
          } else if (Array.isArray(payload.expiring) && payload.expiring.length) {
            items = payload.expiring;
          } else if (Array.isArray(payload.expiry) && payload.expiry.length) {
            items = payload.expiry;
          } else if (Array.isArray(payload.drugs) && payload.drugs.length) {
            // fallback if backend returned a drugs list and includes expiry_date
            items = payload.drugs.filter((dd: any) => dd.expiryDate || dd.expiry_date || dd.expDate);
          }
        }

        if (!items.length) {
          // fallback to local DRUGS that are expired in last 2 months (previous logic)
          const now = new Date();
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(now.getMonth() - 2);

          const localExpired = DRUGS.filter((drug) => {
            const exp = drug.expDate || drug.expiryDate || '';
            if (!exp) return false;
            // original exp format was like "Sep-22" or similar; try to parse consistent with previous logic
            const parts = exp.split('-');
            if (parts.length < 2) return false;
            const monthStr = parts[0];
            const yearStr = parts[1];
            const months: { [key: string]: number } = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            const expYear = 2000 + (parseInt(yearStr) || 0);
            const expMonth = months[monthStr] ?? 0;
            const expDate = new Date(expYear, expMonth, 1);
            const currentDate = new Date();
            return expDate >= twoMonthsAgo && expDate <= currentDate;
          }).map(d => normalizeBackendDrug(d));
          if (mounted) setExpiredMedicines(localExpired);
        } else {
          const normalized = items.map((d: any) => normalizeBackendDrug(d));
          if (mounted) setExpiredMedicines(normalized);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard expiry data:', err);
        // fallback to local DRUGS calculation
        const now = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(now.getMonth() - 2);
        const localExpired = DRUGS.filter((drug) => {
          const exp = drug.expDate || drug.expiryDate || '';
          if (!exp) return false;
          const parts = exp.split('-');
          if (parts.length < 2) return false;
          const monthStr = parts[0];
          const yearStr = parts[1];
          const months: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          const expYear = 2000 + (parseInt(yearStr) || 0);
          const expMonth = months[monthStr] ?? 0;
          const expDate = new Date(expYear, expMonth, 1);
          const currentDate = new Date();
          return expDate >= twoMonthsAgo && expDate <= currentDate;
        }).map(d => normalizeBackendDrug(d));
        if (mounted) setExpiredMedicines(localExpired);
        if (mounted) setError(err?.response?.data?.error || err?.message || 'Failed to fetch expiry data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // UI computed values
  const notifyCount = expiredMedicines.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated Medical Wallpaper Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{ y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-[#00B8A9] opacity-8"
              style={{
                left: `${(i % 10) * 10 + 5}%`,
                top: `${Math.floor(i / 10) * 12 + 2}%`,
                fontSize: '32px'
              }}
            >
              {i % 4 === 0 ? '💊' : i % 4 === 1 ? '⚕️' : i % 4 === 2 ? '🏥' : '⚕'}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Notification Bell */}
      <div
        className="absolute top-6 right-6 z-50"
        onMouseEnter={() => setShowNotifications(true)}
        onMouseLeave={() => setShowNotifications(false)}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-2xl hover:shadow-xl transition-all border border-gray-700/50 relative"
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bell className="w-6 h-6 text-[#00B8A9]" />
          </motion.div>
          {/* Red notification dot */}
          {notifyCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"
            />
          )}
        </motion.button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 right-0 w-80 bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
            >
              <div className="p-4 bg-red-500/10 border-b border-gray-700/50">
                <h3 className="text-red-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Recently Expired Medicines ({notifyCount})
                </h3>
                <p className="text-xs text-gray-400 mt-1">{loading ? 'Loading...' : 'Expired in last 2 months'}</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center text-gray-400">Loading...</div>
                )}

                {!loading && error && (
                  <div className="p-4 text-center text-red-400">Error: {error}</div>
                )}

                {!loading && !error && expiredMedicines.length > 0 ? (
                  expiredMedicines.map((drug, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="text-gray-200">{drug.brandName}</div>
                      <div className="text-sm text-gray-400">{drug.genericName} • NDC: {drug.NDC}</div>
                      <div className="text-xs text-red-400 mt-1">Expired: {drug.expDate}</div>
                    </motion.div>
                  ))
                ) : null}

                {!loading && !error && expiredMedicines.length === 0 && (
                  <div className="p-4 text-center text-gray-400">
                    No expired medicines in last 2 months
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title Section with Baskerville Old Face Font and Breathing Effect */}
        <motion.div 
          className="text-center mb-16 mt-[40px]"
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.34, 1.56, 0.64, 1],
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <motion.h1 
            className="text-6xl mb-4 text-gray-100" 
            style={{ 
              fontFamily: "'Baskerville Old Face', 'Baskerville', 'Libre Baskerville', serif",
              fontWeight: '400',
              fontStyle: 'normal',
              letterSpacing: '0.03em'
            }}
            animate={{ 
              scale: [1, 1.02, 1],
              textShadow: [
                "0 0 10px rgba(0, 184, 169, 0.3)",
                "0 0 25px rgba(0, 184, 169, 0.6)",
                "0 0 10px rgba(0, 184, 169, 0.3)"
              ]
            }}
            transition={{ 
              scale: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              textShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            Welcome to Smart Pharma
          </motion.h1>
          <motion.p 
            className="text-2xl text-gray-300 mt-6" 
            style={{ 
              fontFamily: "'Baskerville Old Face', 'Baskerville', 'Libre Baskerville', serif",
              fontWeight: '300',
              fontStyle: 'italic',
              letterSpacing: '0.05em'
            }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: [1, 1.01, 1]
            }}
            transition={{ 
              opacity: { delay: 0.5, duration: 0.8 },
              x: { 
                delay: 0.5, 
                duration: 0.8,
                type: "spring",
                stiffness: 120
              },
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }
            }}
          >
            where all your needs are met
          </motion.p>
        </motion.div>

        {/* Feature Blocks with Enhanced Interactions (UNCHANGED - keeping amazing button animations) */}
        <div className="flex gap-8 mb-12 flex-wrap justify-center max-w-5xl">
          {/* Dashboard Block */}
          <Link to="/dashboard">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ 
                scale: 1.1, 
                y: -10,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 184, 169, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="w-64 h-64 bg-gray-800/60 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-transparent relative overflow-hidden group"
            >
              {/* Hover Gradient Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-[#00B8A9]/0 via-[#00B8A9]/10 to-[#4ECDC4]/0"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Icon Container with Enhanced Animation */}
              <motion.div 
                className="bg-[#00B8A9]/20 p-6 rounded-full mb-4 relative z-10"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <LayoutDashboard className="w-16 h-16 text-[#00B8A9]" />
              </motion.div>
              
              <motion.span 
                className="text-xl text-gray-200 relative z-10 font-semibold"
                whileHover={{ scale: 1.1, color: "#00B8A9" }}
              >
                Dashboard
              </motion.span>
              
              {/* Subtle Pulse Effect */}
              <motion.div 
                className="absolute w-48 h-48 rounded-full bg-[#00B8A9]/5"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </Link>

          {/* Inventory Block */}
          <Link to="/inventory">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ 
                scale: 1.1, 
                y: -10,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 184, 169, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="w-64 h-64 bg-gray-800/60 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-transparent relative overflow-hidden group"
            >
              {/* Hover Gradient Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-[#00B8A9]/0 via-[#00B8A9]/10 to-[#4ECDC4]/0"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Icon Container with Enhanced Animation */}
              <motion.div 
                className="bg-[#00B8A9]/20 p-6 rounded-full mb-4 relative z-10"
                whileHover={{ scale: 1.2, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Package className="w-16 h-16 text-[#00B8A9]" />
              </motion.div>
              
              <motion.span 
                className="text-xl text-gray-200 relative z-10 font-semibold"
                whileHover={{ scale: 1.1, color: "#00B8A9" }}
              >
                Inventory
              </motion.span>
              
              {/* Subtle Pulse Effect */}
              <motion.div 
                className="absolute w-48 h-48 rounded-full bg-[#00B8A9]/5"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
          </Link>

          {/* Upload CSV Block */}
          <Link to="/upload-csv">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ 
                scale: 1.1, 
                y: -10,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 184, 169, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="w-64 h-64 bg-gray-800/60 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-transparent relative overflow-hidden group"
            >
              {/* Hover Gradient Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-[#00B8A9]/0 via-[#00B8A9]/10 to-[#4ECDC4]/0"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Icon Container with Enhanced Animation */}
              <motion.div 
                className="bg-[#00B8A9]/20 p-6 rounded-full mb-4 relative z-10"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Upload className="w-16 h-16 text-[#00B8A9]" />
              </motion.div>
              
              <motion.span 
                className="text-xl text-gray-200 relative z-10 font-semibold"
                whileHover={{ scale: 1.1, color: "#00B8A9" }}
              >
                Upload CSV
              </motion.span>
              
              {/* Subtle Pulse Effect */}
              <motion.div 
                className="absolute w-48 h-48 rounded-full bg-[#00B8A9]/5"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          </Link>
        </div>

        {/* Floating Message */}
        <div className="w-full overflow-hidden mb-8">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="text-xl text-[#00B8A9] whitespace-nowrap"
            style={{ fontFamily: "'Baskerville Old Face', 'Baskerville', 'Libre Baskerville', serif", fontWeight: '400' }}
          >
            Upload data (excel files) to get latest analysis
          </motion.div>
        </div>
      </div>

      {/* Chatbot Button with Enhanced Animation */}
      <Link to="/assistant">
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8,
            delay: 1,
            type: "spring",
            stiffness: 150,
            damping: 15
          }}
          whileHover={{ 
            scale: 1.15,
            rotate: 5,
            backgroundColor: "#4ECDC4",
            boxShadow: "0 0 30px rgba(0, 184, 169, 0.6)"
          }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 bg-[#00B8A9] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer z-20 overflow-hidden group"
        >
          {/* Hover Pulse Ring */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-[#00B8A9]/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Icon with Bounce Animation */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          >
            <Bot className="w-8 h-8" />
          </motion.div>
          
          <motion.span 
            className="text-lg relative z-10"
            animate={{ 
              x: [0, 3, 0, -3, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            How may I help you??
          </motion.span>
          
          {/* Floating Particles on Hover */}
          <motion.div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ 
                  x: "50%", 
                  y: "50%", 
                  opacity: 0 
                }}
                animate={{ 
                  x: [`${20 + i * 15}%`, `${50 + i * 10}%`],
                  y: [`${30 + i * 10}%`, `${10 + i * 5}%`],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </Link>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-sm z-10">
        Made by Straw Hat Crew (PEC)
      </div>
    </div>
  );
}