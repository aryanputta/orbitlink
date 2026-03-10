import { useState, useEffect } from 'react';
import { useSatellites, useTelemetryStream } from '../hooks/useData';
import { api } from '../services/api';
import TelemetryChart from '../components/TelemetryChart';

function Satellites() {
    const { satellites } = useSatellites();
    const [healthData, setHealthData] = useState({});
    const [selected, setSelected] = useState(null);
    const telemetry = useTelemetryStream(selected);

    useEffect(() => {
        const fetchHealth = () => {
            satellites.forEach(sat => {
                api.getSatelliteHealth(sat.id).then(h => {
                    if (h) setHealthData(prev => ({ ...prev, [sat.id]: h }));
                });
            });
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 3000);
        return () => clearInterval(interval);
    }, [satellites]);

    return (
        <div>
            <h2 style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>Satellite Fleet</h2>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="satellite-row" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, borderBottom: '2px solid var(--border)' }}>
                    <div>NAME</div>
                    <div>NORAD</div>
                    <div>ALT (km)</div>
                    <div>HEALTH</div>
                    <div>STATUS</div>
                </div>
                {satellites.map(sat => {
                    const health = healthData[sat.id];
                    const score = health?.health_score ?? '—';
                    const status = health?.status || 'unknown';
                    return (
                        <div
                            key={sat.id}
                            className="satellite-row"
                            onClick={() => setSelected(sat.id)}
                            style={{ cursor: 'pointer', background: selected === sat.id ? 'var(--bg-card-hover)' : undefined }}
                        >
                            <div className="satellite-name">{sat.name}</div>
                            <div className="mono" style={{ color: 'var(--text-muted)' }}>{sat.noradId}</div>
                            <div className="mono">{sat.altitudeKm?.toFixed(0)}</div>
                            <div className="mono" style={{ fontWeight: 700, color: score >= 90 ? 'var(--accent-green)' : score >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                                {typeof score === 'number' ? score.toFixed(0) : score}
                            </div>
                            <div>
                                <span className={`status-badge ${status}`}>{status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selected && (
                <div className="grid-2">
                    <div className="card">
                        <div className="card-title">Signal & Latency</div>
                        <TelemetryChart data={telemetry} metrics={['signal_strength', 'latency']} />
                    </div>
                    <div className="card">
                        <div className="card-title">Packet Loss & Bandwidth</div>
                        <TelemetryChart data={telemetry} metrics={['packet_loss', 'bandwidth']} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Satellites;
