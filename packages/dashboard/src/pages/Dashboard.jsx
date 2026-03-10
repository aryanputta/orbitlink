import { useState, useEffect } from 'react';
import { useSatellites, useAlerts, useTelemetryStream } from '../hooks/useData';
import { api } from '../services/api';
import TelemetryChart from '../components/TelemetryChart';
import SatelliteMap from '../components/SatelliteMap';

function Dashboard() {
    const { satellites } = useSatellites();
    const { alerts } = useAlerts(10);
    const [selectedSat, setSelectedSat] = useState(null);
    const [healthData, setHealthData] = useState({});
    const telemetryData = useTelemetryStream(selectedSat);

    useEffect(() => {
        if (satellites.length > 0 && !selectedSat) {
            setSelectedSat(satellites[0].id);
        }
    }, [satellites, selectedSat]);

    useEffect(() => {
        if (satellites.length === 0) return;
        const fetchHealth = () => {
            satellites.forEach(sat => {
                api.getSatelliteHealth(sat.id).then(h => {
                    if (h) setHealthData(prev => ({ ...prev, [sat.id]: h }));
                });
            });
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, [satellites]);

    const latest = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1] : null;
    const selectedSatObj = satellites.find(s => s.id === selectedSat);
    const health = selectedSat ? healthData[selectedSat] : null;

    const healthyCount = Object.values(healthData).filter(h => h.status === 'healthy').length;
    const degradedCount = Object.values(healthData).filter(h => h.status === 'degraded').length;
    const criticalCount = Object.values(healthData).filter(h => h.status === 'critical').length;

    return (
        <div>
            {/* Map is the hero — takes full width */}
            <div style={{ marginBottom: 16 }}>
                <SatelliteMap onSelectSatellite={setSelectedSat} />
            </div>

            {/* Status bar — single row, not boxes */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>{satellites.length} satellites tracked</span>
                <span style={{ color: 'var(--accent-green)' }}>{healthyCount} healthy</span>
                <span style={{ color: 'var(--accent-amber)' }}>{degradedCount} degraded</span>
                <span style={{ color: 'var(--accent-red)' }}>{criticalCount} critical</span>
                <span style={{ marginLeft: 'auto' }}>
                    {selectedSatObj ? (
                        <>Viewing: <strong style={{ color: 'var(--text-primary)' }}>{selectedSatObj.name}</strong> — {selectedSatObj.operator}</>
                    ) : 'Select a satellite'}
                </span>
            </div>

            {/* Telemetry panel — selected satellite */}
            {latest && selectedSatObj && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
                    {/* Left: key metrics */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                            {selectedSatObj.constellation} · {selectedSatObj.altitudeKm} km
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Signal</div>
                                <div style={{ fontSize: 24, fontWeight: 600 }}>{latest.signal_strength?.toFixed(1)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>dBm</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Latency</div>
                                <div style={{ fontSize: 24, fontWeight: 600 }}>{latest.latency?.toFixed(0)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ms</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Loss</div>
                                <div style={{ fontSize: 24, fontWeight: 600 }}>{latest.packet_loss?.toFixed(2)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Health</div>
                                <div style={{ fontSize: 24, fontWeight: 600, color: latest.health_score >= 90 ? 'var(--accent-green)' : latest.health_score >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{latest.health_score}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>5G NTN Link Budget</div>
                            <div style={{ fontSize: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>SNR</span>
                                    <span style={{ color: latest.snr > 15 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{latest.snr?.toFixed(1)} dB</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Bandwidth</span>
                                    <span>{latest.bandwidth?.toFixed(1)} Mbps</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Doppler</span>
                                    <span>{latest.doppler_shift?.toFixed(0)} Hz</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>BER</span>
                                    <span>{latest.error_rate?.toExponential(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: charts */}
                    <div>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Signal & Latency</div>
                            <TelemetryChart data={telemetryData} metrics={['signal_strength', 'latency']} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Bandwidth</div>
                            <TelemetryChart data={telemetryData} metrics={['bandwidth']} />
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts — simple list, no box */}
            {alerts.length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Recent Alerts</div>
                    {alerts.slice(0, 4).map(alert => (
                        <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: alert.severity === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-amber)', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{alert.msg}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(alert.created_at).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
