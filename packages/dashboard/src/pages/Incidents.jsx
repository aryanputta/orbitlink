import { useState } from 'react';
import { useIncidents } from '../hooks/useData';
import { api } from '../services/api';

function Incidents() {
    const { incidents, refresh } = useIncidents();
    const [resolving, setResolving] = useState(null);

    const handleResolve = async (id) => {
        setResolving(id);
        await api.resolveIncident(id, 'Resolved by operator');
        refresh();
        setResolving(null);
    };

    const handleReroute = async (id) => {
        const result = await api.rerouteIncident(id);
        if (result?.status === 'rerouted') {
            alert(`Traffic rerouted to ${result.new_station.name}`);
        }
        refresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Incidents</h2>
                <button className="btn" onClick={refresh}>Refresh</button>
            </div>

            {incidents.map(incident => (
                <div key={incident.id} className="card" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <span className={`status-badge ${incident.status === 'RESOLVED' ? 'healthy' : incident.status === 'MITIGATING' ? 'degraded' : 'critical'}`}>
                                    {incident.status}
                                </span>
                                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{incident.type}</span>
                            </div>
                            <div style={{ fontSize: 14, marginBottom: 4 }}>{incident.description}</div>
                            {incident.actionTaken && (
                                <div style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>Action: {incident.actionTaken}</div>
                            )}
                            {incident.rootCause && (
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Root cause: {incident.rootCause}</div>
                            )}
                            {incident.resolutionTimeMs && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Resolved in {(incident.resolutionTimeMs / 1000).toFixed(1)}s
                                </div>
                            )}
                            <div className="alert-time" style={{ marginTop: 8 }}>
                                {new Date(incident.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {incident.status !== 'RESOLVED' && (
                                <>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleReroute(incident.id)}
                                    >
                                        Reroute
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={() => handleResolve(incident.id)}
                                        disabled={resolving === incident.id}
                                    >
                                        {resolving === incident.id ? 'Resolving...' : 'Resolve'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {incidents.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    No incidents recorded
                </div>
            )}
        </div>
    );
}

export default Incidents;
