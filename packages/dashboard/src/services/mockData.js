const SATELLITES = [
    { id: 'sat-01', name: 'ISS (ZARYA)', noradId: 25544, altitudeKm: 408, inclination: 51.6, status: 'ACTIVE', operator: 'NASA/Roscosmos', constellation: 'Human Spaceflight' },
    { id: 'sat-02', name: 'STARLINK-1007', noradId: 44713, altitudeKm: 550, inclination: 53.0, status: 'ACTIVE', operator: 'SpaceX', constellation: 'Starlink' },
    { id: 'sat-03', name: 'STARLINK-2305', noradId: 48274, altitudeKm: 550, inclination: 53.0, status: 'ACTIVE', operator: 'SpaceX', constellation: 'Starlink' },
    { id: 'sat-04', name: 'STARLINK-4781', noradId: 55021, altitudeKm: 540, inclination: 53.2, status: 'ACTIVE', operator: 'SpaceX', constellation: 'Starlink' },
    { id: 'sat-05', name: 'GPS IIF-12', noradId: 41019, altitudeKm: 20200, inclination: 55.0, status: 'ACTIVE', operator: 'US Space Force', constellation: 'GPS' },
    { id: 'sat-06', name: 'GPS III SV05', noradId: 53239, altitudeKm: 20200, inclination: 55.0, status: 'ACTIVE', operator: 'Lockheed Martin', constellation: 'GPS III' },
    { id: 'sat-07', name: 'GOES-18', noradId: 51850, altitudeKm: 35786, inclination: 0.03, status: 'ACTIVE', operator: 'NOAA/NASA', constellation: 'GOES' },
    { id: 'sat-08', name: 'LANDSAT-9', noradId: 49260, altitudeKm: 705, inclination: 98.2, status: 'ACTIVE', operator: 'NASA/USGS', constellation: 'Landsat' },
    { id: 'sat-09', name: 'SBIRS GEO-5', noradId: 49817, altitudeKm: 35786, inclination: 0.05, status: 'ACTIVE', operator: 'Lockheed Martin', constellation: 'SBIRS' },
    { id: 'sat-10', name: 'TDRS-13', noradId: 43781, altitudeKm: 35786, inclination: 0.02, status: 'ACTIVE', operator: 'NASA', constellation: 'TDRS' },
    { id: 'sat-11', name: 'SENTINEL-6A', noradId: 46984, altitudeKm: 1336, inclination: 66.0, status: 'ACTIVE', operator: 'ESA/NASA', constellation: 'Copernicus' },
    { id: 'sat-12', name: 'MUOS-5', noradId: 41622, altitudeKm: 35786, inclination: 4.6, status: 'ACTIVE', operator: 'Lockheed Martin', constellation: 'MUOS' },
];

const STATIONS = [
    { id: 'gs-01', name: 'Svalbard SvalSat', latitude: 78.2306, longitude: 15.3894, elevationM: 450, capacity: 6, region: 'Arctic', status: 'ONLINE' },
    { id: 'gs-02', name: 'Fairbanks NOAA', latitude: 64.8594, longitude: -147.8386, elevationM: 160, capacity: 4, region: 'North America', status: 'ONLINE' },
    { id: 'gs-03', name: 'Wallops Island', latitude: 37.9402, longitude: -75.4664, elevationM: 5, capacity: 5, region: 'North America', status: 'ONLINE' },
    { id: 'gs-04', name: 'Canberra DSN', latitude: -35.4014, longitude: 148.9817, elevationM: 680, capacity: 4, region: 'Oceania', status: 'ONLINE' },
    { id: 'gs-05', name: 'Kourou CSG', latitude: 5.2361, longitude: -52.7686, elevationM: 15, capacity: 4, region: 'South America', status: 'ONLINE' },
    { id: 'gs-06', name: 'Maspalomas INTA', latitude: 27.7633, longitude: -15.6342, elevationM: 205, capacity: 3, region: 'Europe', status: 'ONLINE' },
    { id: 'gs-07', name: 'Tromso SatOps', latitude: 69.6628, longitude: 18.9406, elevationM: 130, capacity: 4, region: 'Europe', status: 'ONLINE' },
    { id: 'gs-08', name: 'McMurdo Station', latitude: -77.8419, longitude: 166.6686, elevationM: 10, capacity: 3, region: 'Antarctica', status: 'ONLINE' },
];

const satState = {};
SATELLITES.forEach(s => {
    const isLEO = s.altitudeKm < 2000;
    const isMEO = s.altitudeKm >= 2000 && s.altitudeKm < 30000;
    satState[s.id] = {
        signalBase: isLEO ? -72 - Math.random() * 15 : isMEO ? -85 - Math.random() * 10 : -95 - Math.random() * 8,
        latencyBase: isLEO ? 30 + Math.random() * 60 : isMEO ? 80 + Math.random() * 50 : 250 + Math.random() * 120,
        packetLossBase: 0.5 + Math.random() * 2,
        bandwidthBase: isLEO ? 50 + Math.random() * 40 : isMEO ? 20 + Math.random() * 30 : 5 + Math.random() * 15,
        dopplerBase: isLEO ? -3000 + Math.random() * 6000 : isMEO ? -500 + Math.random() * 1000 : -50 + Math.random() * 100,
        phase: Math.random() * Math.PI * 2,
    };
});

function generateTelemetry(satId) {
    const state = satState[satId];
    const t = Date.now() / 1000;
    const drift = Math.sin(t * 0.1 + state.phase);
    const noise = () => (Math.random() - 0.5) * 2;

    const signal = state.signalBase + drift * 8 + noise() * 3;
    const latency = Math.max(10, state.latencyBase + drift * 30 + noise() * 15);
    const packetLoss = Math.max(0, state.packetLossBase + drift * 2 + noise() * 1.5);
    const bandwidth = Math.max(1, state.bandwidthBase - drift * 10 + noise() * 5);
    const jitter = Math.max(0, latency * 0.12 + noise() * 5);
    const snr = signal + 120 + noise() * 3;
    const doppler = state.dopplerBase + Math.sin(t * 0.05) * 500;
    const errorRate = Math.max(0, packetLoss * 0.1 + noise() * 0.2);

    const normSignal = Math.min(1, Math.max(0, (signal + 120) / 60));
    const normLatency = 1 - Math.min(1, Math.max(0, latency / 500));
    const normLoss = 1 - Math.min(1, Math.max(0, packetLoss / 100));
    const normBw = Math.min(1, Math.max(0, bandwidth / 100));
    const normJitter = 1 - Math.min(1, Math.max(0, jitter / 100));
    const healthScore = Math.round((normSignal * 0.3 + normLatency * 0.2 + normLoss * 0.2 + normBw * 0.15 + normJitter * 0.15) * 100);

    return {
        satellite_id: satId,
        station_id: STATIONS[Math.floor(Math.random() * STATIONS.length)].id,
        time: new Date().toISOString(),
        signal_strength: parseFloat(signal.toFixed(2)),
        snr: parseFloat(snr.toFixed(2)),
        latency: parseFloat(latency.toFixed(2)),
        jitter: parseFloat(jitter.toFixed(2)),
        packet_loss: parseFloat(packetLoss.toFixed(3)),
        bandwidth: parseFloat(bandwidth.toFixed(2)),
        doppler_shift: parseFloat(doppler.toFixed(2)),
        error_rate: parseFloat(errorRate.toFixed(4)),
        health_score: healthScore,
    };
}

const telemetryHistory = {};
SATELLITES.forEach(s => {
    telemetryHistory[s.id] = [];
    for (let i = 60; i > 0; i--) {
        telemetryHistory[s.id].push(generateTelemetry(s.id));
    }
});

setInterval(() => {
    SATELLITES.forEach(s => {
        const reading = generateTelemetry(s.id);
        telemetryHistory[s.id].push(reading);
        if (telemetryHistory[s.id].length > 120) telemetryHistory[s.id].shift();
    });
}, 3000);

const alerts = [];
let alertCounter = 0;

setInterval(() => {
    if (Math.random() < 0.15) {
        const sat = SATELLITES[Math.floor(Math.random() * SATELLITES.length)];
        const types = [
            { type: 'packet_loss_anomaly', severity: 'WARNING', msg: `Elevated packet loss on ${sat.name}` },
            { type: 'latency_spike', severity: 'CRITICAL', msg: `Latency spike detected on ${sat.name} (${sat.constellation})` },
            { type: 'signal_degradation', severity: 'WARNING', msg: `Signal degradation on ${sat.name}` },
            { type: 'link_failure_prediction', severity: 'CRITICAL', msg: `ML model predicts link failure on ${sat.name} within 60s` },
            { type: 'doppler_drift', severity: 'WARNING', msg: `Abnormal Doppler drift on ${sat.name}` },
            { type: 'handoff_required', severity: 'WARNING', msg: `Ground station handoff required for ${sat.name}` },
        ];
        const pick = types[Math.floor(Math.random() * types.length)];
        alerts.unshift({
            id: `alert-${++alertCounter}`,
            satellite_id: sat.id,
            satellite_name: sat.name,
            ...pick,
            acknowledged: false,
            created_at: new Date().toISOString(),
        });
        if (alerts.length > 100) alerts.pop();
    }
}, 3000);

const incidents = [];

export const mockApi = {
    login: (email, password) => {
        if (email && password) {
            return Promise.resolve({
                token: 'demo-jwt-token',
                user: { id: 'user-1', email, role: 'OPERATOR' },
            });
        }
        return Promise.resolve({ error: 'Invalid credentials' });
    },

    getSatellites: () => Promise.resolve(SATELLITES),

    getSatelliteHealth: (id) => {
        const history = telemetryHistory[id];
        if (!history || history.length === 0) return Promise.resolve({ satellite_id: id, health_score: 0, status: 'unknown' });
        const latest = history[history.length - 1];
        const score = latest.health_score;
        const status = score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'critical';
        return Promise.resolve({ satellite_id: id, health_score: score, status });
    },

    getTelemetry: (satId, limit = 100) => {
        const history = telemetryHistory[satId] || [];
        return Promise.resolve(history.slice(-limit).reverse());
    },

    getLatestTelemetry: (satId) => {
        const history = telemetryHistory[satId];
        if (!history || history.length === 0) return Promise.resolve(null);
        return Promise.resolve(history[history.length - 1]);
    },

    getStations: () => Promise.resolve(STATIONS),
    getAlerts: (limit = 50) => Promise.resolve(alerts.slice(0, limit)),

    acknowledgeAlert: (id) => {
        const alert = alerts.find(a => a.id === id);
        if (alert) alert.acknowledged = true;
        return Promise.resolve(alert);
    },

    getIncidents: (limit = 50) => Promise.resolve(incidents.slice(0, limit)),

    resolveIncident: (id) => {
        const inc = incidents.find(i => i.id === id);
        if (inc) { inc.status = 'RESOLVED'; inc.resolutionTimeMs = Math.floor(Math.random() * 30000) + 5000; }
        return Promise.resolve(inc);
    },

    rerouteIncident: (id) => {
        const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
        return Promise.resolve({ status: 'rerouted', new_station: station });
    },

    getSlaReport: () => Promise.resolve({ period: '30d', total_readings: 864000, healthy_readings: 862560, uptime_percentage: 99.83, sla_target: 99.9, sla_met: false }),
};
