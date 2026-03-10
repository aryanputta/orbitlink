import { useAlerts } from '../hooks/useData';
import { api } from '../services/api';

function Alerts() {
    const { alerts, refresh } = useAlerts();

    const handleAcknowledge = async (id) => {
        await api.acknowledgeAlert(id);
        refresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Alerts</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alerts.length} total</span>
            </div>

            {alerts.map(alert => (
                <div key={alert.id} style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: alert.severity === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-amber)',
                            boxShadow: `0 0 6px ${alert.severity === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-amber)'}`,
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{alert.msg}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{alert.type?.replace(/_/g, ' ')}</span>
                        {!alert.acknowledged ? (
                            <button className="btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleAcknowledge(alert.id)}>ACK</button>
                        ) : (
                            <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>✓</span>
                        )}
                    </div>

                    {/* Computed metrics */}
                    {alert.metrics && (
                        <div style={{ marginLeft: 17, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                            {alert.metrics.packets_sent && (
                                <span>
                                    {alert.metrics.packets_lost}/{alert.metrics.packets_sent} packets lost = <span style={{ color: parseFloat(alert.metrics.loss_percent) > 4 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>{alert.metrics.loss_percent}%</span>
                                </span>
                            )}
                            {alert.metrics.degradation_probability && (
                                <span>
                                    P(failure) = <span style={{ color: alert.metrics.degradation_probability > 0.85 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>{alert.metrics.degradation_probability}</span>
                                </span>
                            )}
                            {alert.metrics.signal && <span>Signal: {alert.metrics.signal.toFixed(1)} dBm</span>}
                            {alert.metrics.latency && <span>Latency: {alert.metrics.latency.toFixed(0)} ms</span>}
                            {alert.metrics.jitter && <span>Jitter: {alert.metrics.jitter.toFixed(1)} ms</span>}
                            {alert.metrics.snr && <span>SNR: {alert.metrics.snr.toFixed(1)} dB</span>}
                            {alert.metrics.bandwidth && <span>BW: {alert.metrics.bandwidth.toFixed(1)} Mbps</span>}
                            {alert.metrics.health_score !== undefined && <span>Health: {alert.metrics.health_score}</span>}
                            {alert.metrics.latency_trend && (
                                <span style={{ color: alert.metrics.latency_trend > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                    Trend: {alert.metrics.latency_trend > 0 ? '↑' : '↓'}{Math.abs(alert.metrics.latency_trend).toFixed(0)}ms
                                </span>
                            )}
                        </div>
                    )}

                    <div style={{ marginLeft: 17, marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                        {alert.satellite_name} · {new Date(alert.created_at).toLocaleTimeString()}
                    </div>
                </div>
            ))}

            {alerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
                    No active alerts — all links nominal
                </div>
            )}
        </div>
    );
}

export default Alerts;
