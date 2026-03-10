import { useState, useEffect } from 'react';
import { useSatellites } from '../hooks/useData';
import { api } from '../services/api';
import TelemetryChart from '../components/TelemetryChart';

const LIVE_FEEDS = [
    { name: 'NASA ISS — 24/7 Live Earth View', src: 'https://www.youtube.com/embed/fO9e9jnhYK8?autoplay=1&mute=1', org: 'NASA' },
    { name: 'SpaceX — Starlink/Starship Mission', src: 'https://www.youtube.com/embed/wbSwFU6tY1c?autoplay=1&mute=1', org: 'SpaceX' },
    { name: 'Global Starlink Tracker', src: 'https://satellitemap.space/?norbits=1', org: 'SpaceX' },
];

function Satellites() {
    const { satellites } = useSatellites();
    const [healthData, setHealthData] = useState({});
    const [telemetryData, setTelemetryData] = useState({});
    const [selected, setSelected] = useState(null);
    const [showFeeds, setShowFeeds] = useState(false);

    useEffect(() => {
        if (satellites.length === 0) return;
        const fetch = () => {
            satellites.forEach(sat => {
                api.getSatelliteHealth(sat.id).then(h => {
                    if (h) setHealthData(prev => ({ ...prev, [sat.id]: h }));
                });
                api.getLatestTelemetry(sat.id).then(t => {
                    if (t) setTelemetryData(prev => ({ ...prev, [sat.id]: t }));
                });
            });
        };
        fetch();
        const interval = setInterval(fetch, 3000);
        return () => clearInterval(interval);
    }, [satellites]);

    const selectedSat = satellites.find(s => s.id === selected);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Fleet — {satellites.length} Satellites</h2>
                <button
                    onClick={() => setShowFeeds(!showFeeds)}
                    style={{
                        background: showFeeds ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                        border: '1px solid ' + (showFeeds ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'),
                        color: showFeeds ? 'var(--accent-red)' : 'var(--accent-green)',
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                >
                    {showFeeds ? '✕ Close Feeds' : '▶ Live Industry Feeds'}
                </button>
            </div>

            {/* Live industry feeds */}
            {showFeeds && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {LIVE_FEEDS.map(feed => (
                        <div key={feed.name}>
                            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <iframe
                                    src={feed.src}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    title={feed.name}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{feed.org} — {feed.name}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* All satellites with live telemetry */}
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {satellites.map(sat => {
                    const health = healthData[sat.id];
                    const tel = telemetryData[sat.id];
                    const score = health?.health_score ?? 0;
                    const status = health?.status || 'unknown';
                    const isSelected = selected === sat.id;

                    return (
                        <div
                            key={sat.id}
                            onClick={() => setSelected(isSelected ? null : sat.id)}
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(74,158,255,0.05)' : 'transparent',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                {/* Name + operator */}
                                <div style={{ minWidth: 180 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{sat.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sat.operator} · {sat.constellation}</div>
                                </div>

                                {/* Orbit */}
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>
                                    {sat.altitudeKm} km · {sat.inclination}°
                                </div>

                                {/* Health */}
                                <div style={{ minWidth: 40, textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: score >= 90 ? 'var(--accent-green)' : score >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                                        {typeof score === 'number' ? score : '—'}
                                    </div>
                                </div>

                                {/* Live metrics */}
                                {tel && (
                                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                        <span>Signal: <strong>{tel.signal_strength?.toFixed(1)}</strong> dBm</span>
                                        <span>Latency: <strong>{tel.latency?.toFixed(0)}</strong> ms</span>
                                        <span>Loss: <strong>{tel.packet_loss?.toFixed(2)}</strong>%</span>
                                        <span>BW: <strong>{tel.bandwidth?.toFixed(1)}</strong> Mbps</span>
                                        <span>Jitter: <strong>{tel.jitter?.toFixed(1)}</strong> ms</span>
                                    </div>
                                )}

                                {/* Status badge */}
                                <div style={{ marginLeft: 'auto' }}>
                                    <span className={`status-badge ${status}`}>{status}</span>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {isSelected && tel && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>NORAD ID</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{sat.noradId}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SNR</div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{tel.snr?.toFixed(1)} dB</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Doppler</div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{tel.doppler_shift?.toFixed(0)} Hz</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>BER</div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{tel.error_rate?.toExponential(2)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bandwidth Util</div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{((tel.bandwidth / 90) * 100).toFixed(0)}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Health Score</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: score >= 90 ? 'var(--accent-green)' : score >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{score}/100</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Satellites;
