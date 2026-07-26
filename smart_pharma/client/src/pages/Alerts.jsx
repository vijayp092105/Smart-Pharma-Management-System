import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/alerts')
            .then(res => res.json())
            .then(res => setAlerts(res.data));
    }, []);

    const grouped = {
        p1: alerts.filter(a => a.priority === 1),
        p2: alerts.filter(a => a.priority === 2),
        p3: alerts.filter(a => a.priority === 3)
    };

    return (
        <div className="page-content">
            <header className="liquid-header">
                <div>
                    <h1 className="liquid-title">Alerts & Expiry</h1>
                    <div className="liquid-subtitle"><AlertTriangle size={18} /> Action Center</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="badge-glass bg-p1" style={{ fontSize: '1rem' }}>
                        {grouped.p1.length} Critical Actions
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* PRIORITY 1 */}
                <section>
                    <h3 style={{ color: '#fca5a5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} /> IMMEDIATE ACTION REQUIRED (Priority 1)
                    </h3>
                    <div className="glass-grid">
                        {grouped.p1.map(alert => (
                            <div key={alert.id} className="col-span-6 p-card p1-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{alert.message}</div>
                                    <div style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{alert.type.toUpperCase()} ALERT</div>
                                </div>
                                <button className="action-btn" style={{ background: '#ef4444' }}>
                                    {alert.action} <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* PRIORITY 2 */}
                <section>
                    <h3 style={{ color: '#fdba74', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} /> UPCOMING RISKS (Priority 2)
                    </h3>
                    <div className="glass-grid">
                        {grouped.p2.map(alert => (
                            <div key={alert.id} className="col-span-4 p-card p2-border">
                                <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>{alert.message}</div>
                                <div className="badge-glass bg-p2" style={{ display: 'inline-block', fontSize: '0.8rem' }}>Action: {alert.action}</div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default AlertsPage;
