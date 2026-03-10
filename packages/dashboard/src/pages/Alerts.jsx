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
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Active Alerts</h2>
                <button className="btn" onClick={refresh}>Refresh</button>
            </div>

            {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.severity?.toLowerCase()}`}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                            <span className={`status-badge ${alert.severity?.toLowerCase()}`}>{alert.severity}</span>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{alert.type}</span>
                        </div>
                        <div style={{ fontSize: 14, marginBottom: 4 }}>{alert.message}</div>
                        <div className="alert-time">
                            {alert.satellite_name || 'Unknown satellite'} · {new Date(alert.created_at).toLocaleString()}
                        </div>
                    </div>
                    {!alert.acknowledged && (
                        <button className="btn" onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                        </button>
                    )}
                    {alert.acknowledged && (
                        <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ ACK</span>
                    )}
                </div>
            ))}

            {alerts.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    No active alerts — system nominal
                </div>
            )}
        </div>
    );
}

export default Alerts;
