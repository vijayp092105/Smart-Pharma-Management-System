import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/Upload';
import InventoryPage from './pages/Inventory';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/Dashboard';
import SalesPage from './pages/Sales';
import AlertsPage from './pages/Alerts';
import { CustomersPage, SuppliersPage, ProductsPage, SettingsPage, OverviewPage } from './pages/MiscPages';
import Chatbot from './components/Chatbot';

function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    if (!user) {
        return <LandingPage onLogin={handleLogin} />;
    }

    return (
        <Router>
            <div className="app-layout">
                <Sidebar userName={user.name} userRole={user.role} />
                <main>
                    <Routes>
                        <Route path="/" element={<OverviewPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/alerts" element={<AlertsPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/sales" element={<SalesPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/suppliers" element={<SuppliersPage />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </main>
            </div>
            <Chatbot />
        </Router>
    );
}

export default App;
