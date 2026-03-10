import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useStations } from '../hooks/useData';
import { api } from '../services/api';

function computePosition(sat, t) {
    const R = 6371;
    const alt = sat.altitudeKm || 550;
    const inc = (sat.inclination || 53) * Math.PI / 180;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(R + alt, 3) / 398600.4418);
    const n = 2 * Math.PI / period;
    const elapsed = (t / 1000) % period;
    const raan = ((t / 1000) * 0.001 + (sat.noradId || 0) * 0.7) % (2 * Math.PI);
    const u = n * elapsed;
    const x = Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc);
    const y = Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc);
    const z = Math.sin(u) * Math.sin(inc);
    return {
        lat: Math.asin(z) * 180 / Math.PI,
        lng: Math.atan2(y, x) * 180 / Math.PI,
    };
}

function SatelliteMap({ onSelectSatellite, realIssPos }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const satMarkersRef = useRef({});
    const issMarkerRef = useRef(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [sats, setSats] = useState([]);
    const stations = useStations();

    useEffect(() => {
        api.getSatellites().then(data => setSats(data || []));
    }, []);

    useEffect(() => {
        if (mapInstanceRef.current) return;
        mapInstanceRef.current = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false,
            minZoom: 2,
            maxZoom: 12,
        });
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
        }).addTo(mapInstanceRef.current);
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => mapInstanceRef.current.invalidateSize(), 150);
        }
    }, [fullscreen]);

    // Ground stations
    useEffect(() => {
        if (!mapInstanceRef.current || stations.length === 0) return;
        stations.forEach(station => {
            L.circleMarker([station.latitude, station.longitude], {
                radius: 4,
                fillColor: '#4a9eff',
                color: '#4a9eff',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.5,
            })
                .bindTooltip(station.name, { permanent: false, direction: 'right', offset: [6, 0] })
                .addTo(mapInstanceRef.current);
        });
    }, [stations]);

    // Simulated satellite positions
    useEffect(() => {
        if (!mapInstanceRef.current || sats.length === 0) return;
        const update = () => {
            const now = Date.now();
            sats.forEach(sat => {
                const pos = computePosition(sat, now);
                if (satMarkersRef.current[sat.id]) {
                    satMarkersRef.current[sat.id].setLatLng([pos.lat, pos.lng]);
                } else {
                    const icon = L.divIcon({
                        className: '',
                        html: `<div style="width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;border:1px solid rgba(255,255,255,0.3)"></div>`,
                        iconSize: [8, 8],
                        iconAnchor: [4, 4],
                    });
                    const marker = L.marker([pos.lat, pos.lng], { icon })
                        .bindTooltip(sat.name, { direction: 'top', offset: [0, -6] })
                        .on('click', () => onSelectSatellite && onSelectSatellite(sat.id))
                        .addTo(mapInstanceRef.current);
                    satMarkersRef.current[sat.id] = marker;
                }
            });
        };
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [sats, onSelectSatellite]);

    // Real ISS position from Open Notify API
    useEffect(() => {
        if (!mapInstanceRef.current || !realIssPos) return;
        if (issMarkerRef.current) {
            issMarkerRef.current.setLatLng([realIssPos.lat, realIssPos.lng]);
        } else {
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;box-shadow:0 0 12px #f59e0b;border:2px solid #fff"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });
            issMarkerRef.current = L.marker([realIssPos.lat, realIssPos.lng], { icon })
                .bindTooltip('ISS (Live)', { permanent: true, direction: 'top', offset: [0, -8] })
                .addTo(mapInstanceRef.current);
        }
    }, [realIssPos]);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={mapRef} className={`map-container${fullscreen ? ' fullscreen' : ''}`} />
            <button className="map-expand-btn" onClick={() => setFullscreen(f => !f)}>
                {fullscreen ? '✕ Close' : '⤢ Expand'}
            </button>
            {fullscreen && (
                <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 10000, fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 8 }}>
                    <span style={{ color: '#34d399' }}>●</span> Simulated · <span style={{ color: '#f59e0b' }}>●</span> ISS Live · <span style={{ color: '#4a9eff' }}>●</span> Ground Station
                </div>
            )}
        </div>
    );
}

export default SatelliteMap;
