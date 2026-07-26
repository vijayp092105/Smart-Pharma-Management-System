import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertTriangle, TrendingUp, TrendingDown, Package,
    ArrowRight, ShoppingCart, DollarSign
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard');
            setData(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading || !data) return (
        <div className="loading-screen">
            <div className="loading-spinner"></div>
            <div style={{ opacity: 0.6, marginTop: '1rem' }}>Scanning Store Data...</div>
        </div>
    );

    // Filter Priority 1 Insight for Top Banner
    const p1Insight = data.insights?.find(i => i.level === 1);

    return (
        <div className="page-content">

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Hello, Admin</h1>
                <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Here is what needs your attention today.</p>
            </header>

            {/* TOP: PRIORITY 1 BANNER */}
            {p1Insight && (
                <div className="priority-banner">
                    <span className="priority-badge">Priority 1 - {p1Insight.title}</span>
                    <div className="priority-content">
                        <h2>{p1Insight.message}</h2>
                        <p>{p1Insight.type === 'Expiry' ? `Estimated Loss: ${p1Insight.value}` : `Impact: ${p1Insight.value}`}</p>
                    </div>
                    <button className="action-btn">
                        {p1Insight.action} <ArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}

            {/* ROW 1: CRITICAL STATS */}
            <div className="glass-grid">

                {/* 1. EXPIRY ALERT */}
                <div className="col-span-4 p-card p1-border">
                    <div className="card-label">Critical Alerts</div>
                    <div className="card-value" style={{ color: '#ef4444' }}>
                        {data.kpis.expiringCount}
                    </div>
                    <div className="card-insight">
                        <span className="priority-badge-sm bg-p1">ACTION REQ</span>
                        <span style={{ color: '#94a3b8' }}>Items expiring &lt; 30 days</span>
                    </div>
                </div>

                {/* 2. SALES TODAY */}
                <div className="col-span-4 p-card p3-border">
                    <div className="card-label">Today's Revenue</div>
                    <div className="card-value" style={{ color: '#10b981' }}>
                        ${(data.financials?.trend[data.financials.trend.length - 1]?.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="card-insight">
                        <TrendingUp size={16} color="#10b981" />
                        <span style={{ color: '#10b981' }}>+12%</span>
                        <span style={{ color: '#64748b', marginLeft: '6px' }}>vs yesterday</span>
                    </div>
                </div>

                {/* 3. NET PROFIT */}
                <div className="col-span-4 p-card p2-border">
                    <div className="card-label">Net Profit (Est)</div>
                    <div className="card-value" style={{ color: '#f97316' }}>
                        ${(data.financials?.trend[data.financials.trend.length - 1]?.profit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="card-insight">
                        <span className="priority-badge-sm bg-p2">MONITOR</span>
                        <span style={{ color: '#94a3b8' }}>Margin holding at 28%</span>
                    </div>
                </div>

            </div>

            {/* ROW 2: DETAILED INTELLIGENCE */}
            <div className="glass-grid">

                {/* REVENUE TREND */}
                <div className="col-span-8 p-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="card-label">14-Day Performance</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Revenue (Blue) vs Profit (Orange)</div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.financials.trend}>
                            <defs>
                                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#gradRev)" />
                            <Area type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={3} fill="none" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* INVENTORY HEATMAP (List Representation) */}
                <div className="col-span-4 p-card">
                    <div className="card-label">Inventory Health</div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                        <div className="inv-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>Healthy Stock</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>{data.inventory.health.healthy}</span>
                            </div>
                            <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                                <div style={{ width: '75%', height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
                            </div>
                        </div>

                        <div className="inv-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>Low Stock (Reorder)</span>
                                <span style={{ fontWeight: 'bold', color: '#f97316' }}>{data.inventory.health.warning}</span>
                            </div>
                            <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                                <div style={{ width: '25%', height: '100%', background: '#f97316', borderRadius: '3px' }}></div>
                            </div>
                        </div>

                        <div className="inv-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>Critical / Expiring</span>
                                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{data.inventory.health.critical}</span>
                            </div>
                            <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                                <div style={{ width: '10%', height: '100%', background: '#ef4444', borderRadius: '3px' }}></div>
                            </div>
                        </div>

                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600, display: 'flex', gap: '8px' }}>
                            <AlertTriangle size={14} /> ACTION
                        </div>
                        <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
                            Restock 5 top-sellers to avoid lost sales.
                        </div>
                    </div>
                </div>

            </div>

            {/* ROW 3: TOP MOVERS */}
            <div className="glass-grid">
                <div className="col-span-6 p-card">
                    <div className="card-label">Best Selling Products</div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {data.performance.topDrugs.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ width: '32px', height: '32px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>{i + 1}</div>
                                <div style={{ flex: 1, marginLeft: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.salesCount} units sold</div>
                                </div>
                                <div style={{ color: '#10b981', fontWeight: 600 }}>
                                    +${d.profit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-6 p-card">
                    <div className="card-label">Other Insights</div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.insights.filter(i => i.level !== 1).map((insight, idx) => (
                            <div key={idx} style={{
                                padding: '1rem',
                                borderLeft: `4px solid ${insight.level === 2 ? '#f97316' : '#10b981'}`,
                                background: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: insight.level === 2 ? '#fbbf24' : '#34d399', textTransform: 'uppercase' }}>
                                        {insight.level === 2 ? 'Warning' : 'Opportunity'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{insight.value}</span>
                                </div>
                                <div style={{ margin: '0.5rem 0' }}>{insight.message}</div>
                                <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
                                    Recommended: {insight.action}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Dashboard;
