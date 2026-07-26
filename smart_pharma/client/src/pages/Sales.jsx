import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

const SalesPage = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/sales')
            .then(res => res.json())
            .then(res => setData(res.data));
    }, []);

    // Gradient definition for charts
    const gradientDef = (
        <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
        </defs>
    );

    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Sales & Profit</h1>
                <div className="liquid-subtitle"><TrendingUp size={18} /> Performance Analysis</div>
            </header>

            <div className="glass-grid">
                {/* REVENUE CHART */}
                <div className="col-span-8 glass-card" style={{ height: '400px' }}>
                    <h3 className="card-label">30-Day Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            {gradientDef}
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={t => t.slice(8)} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* INSIGHTS */}
                <div className="col-span-4 glass-card">
                    <h3 className="card-label">Key Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        <div className="insight-item priority-2" style={{ borderLeft: '3px solid #f97316', paddingLeft: '1rem' }}>
                            <div style={{ color: '#fdba74', fontWeight: '600', marginBottom: '0.2rem' }}>Weekend Spikes Detected</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Sales are 40% higher on Sat/Sun. Ensure popular stock is full by Friday.</div>
                        </div>
                        <div className="insight-item priority-3" style={{ borderLeft: '3px solid #10b981', paddingLeft: '1rem' }}>
                            <div style={{ color: '#6ee7b7', fontWeight: '600', marginBottom: '0.2rem' }}>Healthy Margins</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Net profit margin is stable at 35%.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPage;
