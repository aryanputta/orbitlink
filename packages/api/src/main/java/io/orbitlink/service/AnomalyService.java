package io.orbitlink.service;

import io.orbitlink.model.Alert;
import io.orbitlink.model.Incident;
import io.orbitlink.repository.AlertRepository;
import io.orbitlink.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class AnomalyService {

    private static final Logger log = LoggerFactory.getLogger(AnomalyService.class);

    private final AlertRepository alertRepo;
    private final IncidentRepository incidentRepo;
    private final SimpMessagingTemplate websocket;

    public AnomalyService(AlertRepository alertRepo, IncidentRepository incidentRepo,
            SimpMessagingTemplate websocket) {
        this.alertRepo = alertRepo;
        this.incidentRepo = incidentRepo;
        this.websocket = websocket;
    }

    public void evaluate(Map<String, Object> reading) {
        UUID satId = UUID.fromString(reading.get("satellite_id").toString());
        UUID stationId = UUID.fromString(reading.get("station_id").toString());

        double packetLoss = toDouble(reading.get("packet_loss"));
        double latency = toDouble(reading.get("latency"));
        double signal = toDouble(reading.get("signal_strength"));
        double healthScore = toDouble(reading.get("health_score"));

        if (packetLoss > 40) {
            createAlert(satId, stationId, Alert.Severity.CRITICAL,
                    "packet_loss_anomaly", "Severe packet loss: " + packetLoss + "%");
        } else if (packetLoss > 15) {
            createAlert(satId, stationId, Alert.Severity.WARNING,
                    "packet_loss_anomaly", "Elevated packet loss: " + packetLoss + "%");
        }

        if (latency > 450) {
            createAlert(satId, stationId, Alert.Severity.CRITICAL,
                    "latency_anomaly", "Critical latency: " + latency + "ms");
        } else if (latency > 300) {
            createAlert(satId, stationId, Alert.Severity.WARNING,
                    "latency_anomaly", "High latency: " + latency + "ms");
        }

        if (signal < -110) {
            createAlert(satId, stationId, Alert.Severity.CRITICAL,
                    "signal_anomaly", "Signal near noise floor: " + signal + " dBm");
        } else if (signal < -100) {
            createAlert(satId, stationId, Alert.Severity.WARNING,
                    "signal_anomaly", "Weak signal: " + signal + " dBm");
        }

        if (healthScore < 70) {
            Incident incident = new Incident();
            incident.setSatelliteId(satId);
            incident.setType("link_degradation");
            incident.setDescription("Health score dropped to " + healthScore);
            incident.setActionTaken("Automated rerouting initiated");
            incident.setStatus(Incident.Status.MITIGATING);
            incidentRepo.save(incident);

            websocket.convertAndSend("/topic/incidents", incident);
            log.warn("Critical health score {} for satellite {}", healthScore, satId);
        }
    }

    private void createAlert(UUID satId, UUID stationId, Alert.Severity severity,
            String type, String message) {
        Alert alert = new Alert();
        alert.setSatelliteId(satId);
        alert.setStationId(stationId);
        alert.setSeverity(severity);
        alert.setType(type);
        alert.setMessage(message);
        alertRepo.save(alert);

        websocket.convertAndSend("/topic/alerts", alert);
    }

    private double toDouble(Object val) {
        if (val == null)
            return 0;
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }
}
