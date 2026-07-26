import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, AlertTriangle, Package, Pill,
    TrendingUp, Users, Truck, Upload, Settings, Smartphone
} from 'lucide-react';

const Sidebar = ({ userName, userRole }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const isAdmin = userRole === 'admin';

    return (
        <div className="store-sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Pill size={28} color="#fff" />
                </div>
                <div className="logo-text">
                    <h1>Smart Pharma</h1>
                    <span className="badge-pro">{isAdmin ? 'Admin' : 'Staff'}</span>
                </div>
            </div>

            <nav className="store-nav">
                <div className="nav-group"><span className="nav-text">OVERVIEW</span></div>
                <NavItem to="/" icon={<Smartphone size={20} />} label="Overview" active={isActive('/')} />
                <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/dashboard')} />
                <NavItem to="/alerts" icon={<AlertTriangle size={20} />} label="Alerts & Expiry" active={isActive('/alerts')} isAlert />

                <div className="nav-group"><span className="nav-text">MANAGEMENT</span></div>
                <NavItem to="/inventory" icon={<Package size={20} />} label="Inventory" active={isActive('/inventory')} />
                <NavItem to="/products" icon={<Pill size={20} />} label="Products" active={isActive('/products')} />
                <NavItem to="/sales" icon={<TrendingUp size={20} />} label="Sales & Profit" active={isActive('/sales')} />

                <div className="nav-group"><span className="nav-text">PARTNERS</span></div>
                <NavItem to="/customers" icon={<Users size={20} />} label="Customers" active={isActive('/customers')} />
                <NavItem to="/suppliers" icon={<Truck size={20} />} label="Suppliers" active={isActive('/suppliers')} />

                {isAdmin && (
                    <>
                        <div className="nav-group"><span className="nav-text">SYSTEM</span></div>
                        <NavItem to="/upload" icon={<Upload size={20} />} label="Upload Data" active={isActive('/upload')} />
                        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={isActive('/settings')} />
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">{(userName || 'A').charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <span className="name">Welcome, {userName || 'User'}</span>
                        <span className="role">{isAdmin ? 'Store Owner' : 'Store Manager'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NavItem = ({ to, icon, label, active, isAlert }) => (
    <Link to={to} className={`store-nav-item ${active ? 'active' : ''} ${isAlert ? 'alert-item' : ''}`}>
        <span className="icon-box">{icon}</span>
        <span className="nav-text">{label}</span>
        {isAlert && <span className="dot-alert nav-text"></span>}
    </Link>
);

export default Sidebar;
