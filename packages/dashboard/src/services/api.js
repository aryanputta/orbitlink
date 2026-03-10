import { mockApi } from './mockData';

const API_BASE = '/api/v1';
const DEMO_MODE = !window.location.port || window.location.port === '3000';

async function request(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        return res.json();
    } catch {
        return null;
    }
}

export const api = DEMO_MODE ? mockApi : {
    login: (email, password) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    register: (email, password, role) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) }),

    getSatellites: () => request('/satellites'),
    getSatelliteHealth: (id) => request(`/satellites/${id}/health`),
    getTelemetry: (satId, limit = 100) => request(`/telemetry/${satId}?limit=${limit}`),
    getLatestTelemetry: (satId) => request(`/telemetry/${satId}/latest`),

    getStations: () => request('/stations'),

    getAlerts: (limit = 50) => request(`/alerts?limit=${limit}`),
    acknowledgeAlert: (id) => request(`/alerts/${id}/acknowledge`, { method: 'POST' }),

    getIncidents: (limit = 50) => request(`/incidents?limit=${limit}`),
    resolveIncident: (id, rootCause) =>
        request(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify({ root_cause: rootCause }) }),
    rerouteIncident: (id) => request(`/incidents/${id}/reroute`, { method: 'POST' }),

    getSlaReport: () => request('/reports/sla'),
};
