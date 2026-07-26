import React from 'react';
import { Users, Truck, Package, Settings, Smartphone } from 'lucide-react';

/* --- CUSTOMERS PAGE --- */
export const CustomersPage = () => {
    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Customer Insights</h1>
                <div className="liquid-subtitle"><Users size={18} /> Demographics & Loyalty</div>
            </header>
            <div className="glass-grid">
                <div className="col-span-4 glass-card">
                    <div className="card-value">1,240</div>
                    <div className="card-label">Total Customers</div>
                </div>
                <div className="col-span-4 glass-card">
                    <div className="card-value">65%</div>
                    <div className="card-label">Repeat Rate</div>
                </div>
                <div className="col-span-4 glass-card">
                    <div className="card-value">60:40</div>
                    <div className="card-label">Insured vs Cash</div>
                </div>
            </div>
            <div className="glass-card" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Customer Segmentation Visualization</h3>
                <p>Chart data loading from /api/customers...</p>
            </div>
        </div>
    );
};

/* --- SUPPLIERS PAGE --- */
export const SuppliersPage = () => {
    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Supplier Risk</h1>
                <div className="liquid-subtitle"><Truck size={18} /> Performance & reliability</div>
            </header>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr><th>Supplier Name</th><th>Risk Score</th><th>On-Time Rate</th><th>Expiry Contribution</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        <tr className="glass-list-item">
                            <td>PharmaDistro Ltd</td>
                            <td><span className="badge-glass bg-p3">Low</span></td>
                            <td>98%</td>
                            <td>1.2%</td>
                            <td><button className="action-btn">History</button></td>
                        </tr>
                        <tr className="glass-list-item">
                            <td>MediQuick Supply</td>
                            <td><span className="badge-glass bg-p1">High</span></td>
                            <td>75%</td>
                            <td>4.5%</td>
                            <td><button className="action-btn">Review</button></td>
                        </tr>
                        <tr className="glass-list-item">
                            <td>Global Health Inc</td>
                            <td><span className="badge-glass bg-p2">Medium</span></td>
                            <td>88%</td>
                            <td>2.1%</td>
                            <td><button className="action-btn">Contact</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* --- PRODUCTS PAGE --- */
export const ProductsPage = () => {
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedProduct, setSelectedProduct] = React.useState(null);

    React.useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(res => {
                setProducts(res.data || []);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    // SEARCH LOGIC
    const filtered = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            (p.brandName || '').toLowerCase().includes(term) ||
            (p.genericName || '').toLowerCase().includes(term) ||
            (p.supplierName || '').toLowerCase().includes(term)
        );
    });

    // Helper for Status Badge
    const getStatus = (stock, expiry) => {
        if (!stock) stock = 0;
        const days = expiry ? Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 999;

        if (days < 30) return { label: 'Expiring', color: 'bg-p1', text: 'Critical Expiry Risk' };
        if (stock < 20) return { label: 'Low Stock', color: 'bg-p2', text: 'Stock Replenishment Needed' };
        return { label: 'Healthy', color: 'bg-p3', text: 'Stock Status Good' };
    };

    if (loading) return <div className="page-content">Loading Catalog...</div>;

    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Product Catalog</h1>
                <div className="liquid-subtitle"><Package size={18} /> Master SKU List</div>
            </header>

            <div className="glass-card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search by name, generic, or supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    {filtered.length} Products Found
                </div>
            </div>

            <div style={{ overflowX: 'auto', minHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '1rem' }}>Product</th>
                            <th style={{ padding: '1rem' }}>Generic Name</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Supplier</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p, i) => {
                            const status = getStatus(p.stock, p.expDate);
                            return (
                                <tr
                                    key={i}
                                    className="glass-list-item"
                                    onClick={() => setSelectedProduct(p)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                >
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{p.brandName}</td>
                                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{p.genericName}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {p.stock !== undefined && p.stock !== 0 ? p.stock : <span style={{ opacity: 0.5 }}>N/A</span>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{p.supplierName || 'Unmapped'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge-glass ${status.color}`}>{status.label}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No products available in dataset matching your search.
                    </div>
                )}
            </div>

            {/* PRODUCT DETAIL MODAL */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }} onClick={() => setSelectedProduct(null)}>
                    <div className="glass-card" style={{ width: '500px', padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '2rem', background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>{selectedProduct.brandName}</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>{selectedProduct.genericName}</p>
                            <div style={{ marginTop: '1rem', display: 'inline-block' }}>
                                <span className={`badge-glass ${getStatus(selectedProduct.stock, selectedProduct.expDate).color}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
                                    {getStatus(selectedProduct.stock, selectedProduct.expDate).label}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ color: '#64748b', fontSize: '0.85rem' }}>Stock Quantity</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    {selectedProduct.stock || 'N/A'} <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.6 }}>units</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#64748b', fontSize: '0.85rem' }}>Expiry Date</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedProduct.expDate || 'N/A'}</div>
                            </div>
                            <div>
                                <label style={{ color: '#64748b', fontSize: '0.85rem' }}>Supplier</label>
                                <div style={{ fontSize: '1.1rem' }}>{selectedProduct.supplierName || 'Unknown'}</div>
                            </div>
                            <div>
                                <label style={{ color: '#64748b', fontSize: '0.85rem' }}>NDC Code</label>
                                <div style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{selectedProduct.NDC}</div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                <strong>Insight:</strong> {getStatus(selectedProduct.stock, selectedProduct.expDate).text}.
                                <br />This item is sourced from {selectedProduct.supplierName || 'the registered supplier'}.
                            </p>
                        </div>

                        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                            <button className="action-btn" onClick={() => setSelectedProduct(null)}>Close Details</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


/* --- SETTINGS PAGE --- */
export const SettingsPage = () => {
    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Settings</h1>
                <div className="liquid-subtitle"><Settings size={18} /> System Preferences</div>
            </header>
            <div className="glass-grid">
                <div className="col-span-6 glass-card">
                    <h3 className="card-label">Alert Thresholds</h3>
                    <div style={{ margin: '1rem 0' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Expiry Warning (Days)</label>
                        <input type="number" defaultValue={30} />
                    </div>
                    <div style={{ margin: '1rem 0' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Critical Expiry (Days)</label>
                        <input type="number" defaultValue={7} />
                    </div>
                    <button className="action-btn">Save Changes</button>
                </div>
                <div className="col-span-6 glass-card">
                    <h3 className="card-label">App Appearance</h3>
                    <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="p-card" style={{ width: '100px', height: '60px', background: 'var(--sidebar-bg)', border: '2px solid #3b82f6' }}></div>
                        <span>Liquid Glass (Active)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* --- OVERVIEW PAGE (Landing) --- */
export const OverviewPage = () => {
    const [stats, setStats] = React.useState({ products: 0, alerts: 0, lowStock: 0, revenue: 0, profit: 0 });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Overview Counts
                const overviewRes = await fetch('http://localhost:5000/api/overview').then(r => r.json());

                // Fetch Sales Financials
                const salesRes = await fetch('http://localhost:5000/api/sales').then(r => r.json());

                setStats({
                    ...overviewRes,
                    revenue: salesRes.revenue,
                    profit: salesRes.profit
                });
            } catch (err) {
                console.error("Failed to load overview data");
            }
        };
        fetchData();
    }, []);

    const currency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="page-content">
            <header className="liquid-header">
                <h1 className="liquid-title">Store Overview</h1>
                <div className="liquid-subtitle"><Smartphone size={18} /> Quick Status Check</div>
            </header>
            <div className="glass-grid">
                <div className="col-span-6 p-card p1-border">
                    <div className="card-label">Total Revenue</div>
                    <div className="card-value">{currency(stats.revenue)}</div>
                    <div className="card-insight" style={{ color: '#6ee7b7' }}>Real-time Aggregation</div>
                </div>
                <div className="col-span-6 p-card p3-border">
                    <div className="card-label">Net Profit</div>
                    <div className="card-value">{currency(stats.profit)}</div>
                    <div className="card-insight">Based on Cost Price</div>
                </div>
                <div className="col-span-4 glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444' }}>{stats.alerts}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Critical Alerts</div>
                </div>
                <div className="col-span-4 glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f97316' }}>{stats.lowStock || 0}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Low Stock</div>
                </div>
                <div className="col-span-4 glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff' }}>{stats.products}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Items</div>
                </div>
            </div>
        </div>
    )
}
