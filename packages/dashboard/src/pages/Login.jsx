import { useState } from 'react';
import { api } from '../services/api';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await api.login(email, password);
        setLoading(false);

        if (result?.token) {
            onLogin(result.token);
        } else {
            setError(result?.error || 'Login failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
        }}>
            <div style={{ width: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                        <div className="dot" />
                        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>ORBITLINK</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Satellite Network Operations Platform</div>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <div style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                    <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Access Mission Control'}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        Configure credentials via SEED_PASSWORD env var
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
