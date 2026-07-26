import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Search, AlertTriangle, AlertCircle, TrendingUp,
    Calendar, Package, DollarSign, Filter, Sparkles
} from 'lucide-react';

const InventoryPage = () => {
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [modalType, setModalType] = useState(null); // 'expiry' or 'lowstock' or null

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/data/drugs');
            setDrugs(res.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // --- INTELLIGENCE LOGIC ---
    const now = new Date();
    const processedDrugs = drugs.map(d => {
        const exp = new Date(d.expDate);
        const daysToExpiry = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        const value = (d.stock || 0) * (d.purchasePrice || 0);

        let status = 'healthy';
        let sellFirst = false;
        if (daysToExpiry < 30) { status = 'critical'; sellFirst = true; }
        else if (daysToExpiry < 90) status = 'warning';

        return { ...d, daysToExpiry, status, sellFirst, totalValue: value };
    });

    // Stats
    const totalValue = processedDrugs.reduce((acc, d) => acc + (d.totalValue || 0), 0);
    const criticalCount = processedDrugs.filter(d => d.status === 'critical').length;
    const warningCount = processedDrugs.filter(d => d.status === 'warning').length;
    const lowStockCount = processedDrugs.filter(d => (d.stock || 0) < 20).length;

    // Filter & Sort (FEFO)
    const filteredDrugs = processedDrugs.filter(d => {
        const matchesSearch = d.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'expiry') return d.status === 'critical' || d.status === 'warning';
        if (filter === 'lowstock') return (d.stock || 0) < 20;
        return true;
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry);

    if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;

    return (
        <div className="page-content">

            <header className="liquid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="liquid-title">Inventory Intelligence</h1>
                    <div className="liquid-subtitle">
                        <Package size={18} />
                        <span>Real-time Stock Valuation & FEFO Management</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Valuation</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                        ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </header>

            {/* --- INTELLIGENCE CARDS (CLICKABLE MODALS) --- */}
            <div className="glass-grid" style={{ marginBottom: '2rem' }}>
                <div className="col-span-4 p-card p1-border" onClick={() => setModalType('expiry')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="card-label">Expiry Risk</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="kpi-icon-glass" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <AlertTriangle />
                        </div>
                        <div>
                            <div className="card-value">{criticalCount}</div>
                            <div className="card-insight" style={{ color: '#fca5a5' }}>Click to view details</div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 p-card p2-border" onClick={() => setModalType('lowstock')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="card-label">Restock Needed</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="kpi-icon-glass" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
                            <AlertCircle />
                        </div>
                        <div>
                            <div className="card-value">{lowStockCount}</div>
                            <div className="card-insight" style={{ color: '#fdba74' }}>Click to view details</div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 p-card p3-border" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="card-label">Active SKUs</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="kpi-icon-glass" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Package />
                        </div>
                        <div>
                            <div className="card-value">{processedDrugs.length}</div>
                            <div className="card-insight" style={{ color: '#6ee7b7' }}>Total Products</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTROLS --- */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem', width: '100%' }}
                    />
                </div>
                {/* Visual Filter Buttons preserved for Table Sorting */}
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button className={`action-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                </div>
            </div>

            {/* --- GLASS TABLE (CENTERED & ALIGNED) --- */}
            <div style={{ paddingBottom: '2rem', width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '1rem' }}>Medicine Details</th>
                            <th style={{ padding: '1rem' }}>Stock Level</th>
                            <th style={{ padding: '1rem' }}>Expiry (FEFO)</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Value</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDrugs.map((d, i) => (
                            <tr key={i} className="glass-list-item" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{d.brandName}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{d.genericName} — {d.category}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{d.stock}</span>
                                        {d.stock < 20 && <span className="badge-glass" style={{ background: 'rgba(249,115,22,0.2)', color: '#fdba74' }}>Low</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            color: d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f97316' : '#10b981',
                                            fontWeight: 500
                                        }}>
                                            {d.status === 'critical' && <AlertTriangle size={16} />}
                                            {d.expDate}
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({d.daysToExpiry} days)</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                    ₹{Number(d.sellPrice || 0).toFixed(2)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button className="action-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredDrugs.length === 0 && (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b', marginTop: '1rem' }}>
                        No products found.
                    </div>
                )}
            </div>

            {/* --- LIQUID GLASS MODAL OVERLAY --- */}
            {modalType && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="glass-card" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
                                {modalType === 'expiry' ? 'items Expiring Soon' : 'items Low Stock'}
                            </h2>
                            <button onClick={() => setModalType(null)} className="action-btn">Close</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            {processedDrugs.filter(d =>
                                modalType === 'expiry' ? d.status === 'critical' || d.status === 'warning' : (d.stock || 0) < 20
                            ).map((d, i) => (
                                <div key={i} className="glass-list-item" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 600 }}>{d.brandName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.genericName}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            color: modalType === 'expiry' ? '#ef4444' : '#f97316',
                                            fontWeight: 600
                                        }}>
                                            {modalType === 'expiry' ? `${d.daysToExpiry} Days` : `${d.stock} Units`}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                                            ₹{Number(d.sellPrice).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {processedDrugs.filter(d => modalType === 'expiry' ? d.status === 'critical' || d.status === 'warning' : (d.stock || 0) < 20).length === 0 && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                                    No items found in this category.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
