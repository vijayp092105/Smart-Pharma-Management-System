import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import UploadCSV from './components/UploadCSV';
import Assistant from './components/Assistant';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/upload-csv" element={<UploadCSV />} />
        <Route path="/assistant" element={<Assistant />} />
      </Routes>
    </Router>
  );
}
