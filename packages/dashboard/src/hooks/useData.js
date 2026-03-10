import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export function useSatellites() {
    const [satellites, setSatellites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSatellites().then(data => {
            setSatellites(data || []);
            setLoading(false);
        });
    }, []);

    return { satellites, loading };
}

export function useAlerts(limit = 50) {
    const [alerts, setAlerts] = useState([]);

    const refresh = useCallback(() => {
        api.getAlerts(limit).then(data => setAlerts(data || []));
    }, [limit]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { alerts, refresh };
}

export function useIncidents(limit = 50) {
    const [incidents, setIncidents] = useState([]);

    const refresh = useCallback(() => {
        api.getIncidents(limit).then(data => setIncidents(data || []));
    }, [limit]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { incidents, refresh };
}

export function useTelemetryStream(satelliteId) {
    const [data, setData] = useState([]);
    const bufferRef = useRef([]);

    useEffect(() => {
        if (!satelliteId) return;

        api.getTelemetry(satelliteId, 60).then(history => {
            const sorted = (history || []).reverse();
            bufferRef.current = sorted;
            setData(sorted);
        });

        const interval = setInterval(() => {
            api.getLatestTelemetry(satelliteId).then(latest => {
                if (!latest) return;
                bufferRef.current = [...bufferRef.current.slice(-59), latest];
                setData([...bufferRef.current]);
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [satelliteId]);

    return data;
}

export function useStations() {
    const [stations, setStations] = useState([]);

    useEffect(() => {
        api.getStations().then(data => setStations(data || []));
    }, []);

    return stations;
}
