import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Satellites from './pages/Satellites';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <nav className="topnav">
                    <div className="topnav-brand">
                        <div className="live-dot" />
                        <span>OrbitalOps</span>
                    </div>
                    <div className="topnav-links">
                        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/satellites" className={({ isActive }) => isActive ? 'active' : ''}>
                            Satellites
                        </NavLink>
                        <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
                            Alerts
                        </NavLink>
                        <NavLink to="/incidents" className={({ isActive }) => isActive ? 'active' : ''}>
                            Incidents
                        </NavLink>
                    </div>
                    <div className="topnav-status">
                        {new Date().toUTCString().slice(0, -4)} UTC
                    </div>
                </nav>

                <main className="main">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/satellites" element={<Satellites />} />
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/incidents" element={<Incidents />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
