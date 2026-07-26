import React, { useState } from 'react';
import { Pill, ArrowRight, Lock, User, Hash } from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    displayName: '',
    role: 'admin'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation: Login ID must be numbers only
    if (name === 'loginId') {
      if (value && !/^\d*$/.test(value)) {
        setError('Login ID must contain numbers only.');
        return;
      }
    }

    setError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.loginId || !formData.password || !formData.displayName) {
      setError('All fields are required.');
      return;
    }

    // Simulate Login
    onLogin({ name: formData.displayName, role: formData.role });
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", color: '#fff'
    }}>
      {/* Background Ambience */}
      <div className="mesh-gradient-1" style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', top: '-10%', left: '-10%', filter: 'blur(60px)' }}></div>
      <div className="mesh-gradient-2" style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', bottom: '-10%', right: '-10%', filter: 'blur(60px)' }}></div>

      {/* Login Card */}
      <div className="glass-card" style={{
        width: '400px', padding: '3rem',
        backdropFilter: 'blur(30px)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px rgba(59,130,246,0.3)'
          }}>
            <Pill size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Smart Pharma Inventory Manager</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Login ID */}
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }}>Login ID (Numbers Only)</label>
            <div style={{ position: 'relative' }}>
              <Hash size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                name="loginId"
                value={formData.loginId}
                onChange={handleChange}
                placeholder="Enter Numeric ID"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>


          {/* Display Name */}
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g. Reddy"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', display: 'block' }}>Select Role</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid',
                  borderColor: formData.role === 'admin' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  background: formData.role === 'admin' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color: formData.role === 'admin' ? '#fff' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'manager' })}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid',
                  borderColor: formData.role === 'manager' ? '#10b981' : 'rgba(255,255,255,0.1)',
                  background: formData.role === 'manager' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  color: formData.role === 'manager' ? '#fff' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Manager
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

          <button
            type="submit"
            className="action-btn"
            style={{
              marginTop: '1rem', width: '100%', justifyContent: 'center', padding: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none'
            }}
          >
            Sign In needed <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;
