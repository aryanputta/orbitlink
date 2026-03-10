import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

function TelemetryChart({ data, metrics }) {
    const colors = {
        signal_strength: '#3b82f6',
        latency: '#f59e0b',
        packet_loss: '#ef4444',
        bandwidth: '#10b981',
        jitter: '#8b5cf6',
        health_score: '#06b6d4',
        snr: '#ec4899',
    };

    const formatted = data.map((d, i) => ({
        ...d,
        index: i,
        time: d.time ? new Date(d.time).toLocaleTimeString() : i.toString(),
    }));

    const useArea = metrics.length === 1;

    return (
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                {useArea ? (
                    <AreaChart data={formatted}>
                        <defs>
                            {metrics.map(metric => (
                                <linearGradient key={metric} id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors[metric] || '#3b82f6'} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={colors[metric] || '#3b82f6'} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(12, 17, 32, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(56, 78, 130, 0.3)',
                                borderRadius: 10,
                                fontSize: 11,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        />
                        {metrics.map(metric => (
                            <Area
                                key={metric}
                                type="monotone"
                                dataKey={metric}
                                stroke={colors[metric] || '#3b82f6'}
                                strokeWidth={2}
                                fill={`url(#grad-${metric})`}
                                dot={false}
                                animationDuration={300}
                            />
                        ))}
                    </AreaChart>
                ) : (
                    <LineChart data={formatted}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(12, 17, 32, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(56, 78, 130, 0.3)',
                                borderRadius: 10,
                                fontSize: 11,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                        />
                        {metrics.map(metric => (
                            <Line
                                key={metric}
                                type="monotone"
                                dataKey={metric}
                                stroke={colors[metric] || '#3b82f6'}
                                strokeWidth={2}
                                dot={false}
                                animationDuration={300}
                            />
                        ))}
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}

export default TelemetryChart;
