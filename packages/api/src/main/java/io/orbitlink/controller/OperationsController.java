package io.orbitlink.controller;

import io.orbitlink.repository.*;
import io.orbitlink.model.Incident;
import io.orbitlink.service.RoutingService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class OperationsController {

    private final AlertRepository alertRepo;
    private final IncidentRepository incidentRepo;
    private final GroundStationRepository stationRepo;
    private final RoutingService routingService;
    private final TelemetryRepository telemetryRepo;

    public OperationsController(AlertRepository alertRepo, IncidentRepository incidentRepo,
            GroundStationRepository stationRepo, RoutingService routingService,
            TelemetryRepository telemetryRepo) {
        this.alertRepo = alertRepo;
        this.incidentRepo = incidentRepo;
        this.stationRepo = stationRepo;
        this.routingService = routingService;
        this.telemetryRepo = telemetryRepo;
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(alertRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)));
    }

    @PostMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeAlert(@PathVariable UUID id) {
        return alertRepo.findById(id).map(alert -> {
            alert.setAcknowledged(true);
            alert.setAcknowledgedAt(Instant.now());
            alertRepo.save(alert);
            return ResponseEntity.ok(alert);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/incidents")
    public ResponseEntity<?> getIncidents(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(incidentRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)));
    }

    @GetMapping("/incidents/{id}")
    public ResponseEntity<?> getIncident(@PathVariable UUID id) {
        return incidentRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<?> resolveIncident(@PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        return incidentRepo.findById(id).map(incident -> {
            long resolutionMs = Instant.now().toEpochMilli() - incident.getCreatedAt().toEpochMilli();
            incident.setStatus(Incident.Status.RESOLVED);
            incident.setRootCause(body != null ? body.get("root_cause") : null);
            incident.setResolutionTimeMs(resolutionMs);
            incident.setOperatorIntervention(true);
            incident.setUpdatedAt(Instant.now());
            incidentRepo.save(incident);
            return ResponseEntity.ok(incident);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/incidents/{id}/reroute")
    public ResponseEntity<?> reroute(@PathVariable UUID id) {
        return incidentRepo.findById(id).map(incident -> {
            var latest = telemetryRepo.findFirstBySatelliteIdOrderByTimeDesc(incident.getSatelliteId());
            if (latest == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No telemetry data"));
            }

            return routingService.findBestRoute(incident.getSatelliteId(), latest.getStationId())
                    .map(station -> ResponseEntity.ok(Map.of(
                            "status", "rerouted",
                            "new_station", Map.of("id", station.getId(), "name", station.getName()))))
                    .orElse(ResponseEntity.status(503).body(Map.of("error", "No available stations")));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stations")
    public ResponseEntity<?> getStations() {
        return ResponseEntity.ok(stationRepo.findAll());
    }

    @GetMapping("/stations/{id}")
    public ResponseEntity<?> getStation(@PathVariable UUID id) {
        return stationRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reports/sla")
    public ResponseEntity<?> getSlaReport() {
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 3600);
        long total = telemetryRepo.countByTimeAfter(thirtyDaysAgo);
        long healthy = telemetryRepo.countByHealthScoreGreaterThanEqualAndTimeAfter(70.0, thirtyDaysAgo);
        double uptime = total > 0 ? (healthy * 100.0 / total) : 100.0;

        return ResponseEntity.ok(Map.of(
                "period", "30d",
                "total_readings", total,
                "healthy_readings", healthy,
                "uptime_percentage", Math.round(uptime * 100.0) / 100.0,
                "sla_target", 99.9,
                "sla_met", uptime >= 99.9));
    }
}
