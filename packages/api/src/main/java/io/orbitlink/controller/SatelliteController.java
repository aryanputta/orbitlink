package io.orbitlink.controller;

import io.orbitlink.repository.SatelliteRepository;
import io.orbitlink.repository.TelemetryRepository;
import io.orbitlink.service.HealthScorer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/satellites")
public class SatelliteController {

    private final SatelliteRepository satelliteRepo;
    private final TelemetryRepository telemetryRepo;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper = new ObjectMapper();

    public SatelliteController(SatelliteRepository satelliteRepo,
            TelemetryRepository telemetryRepo,
            StringRedisTemplate redis) {
        this.satelliteRepo = satelliteRepo;
        this.telemetryRepo = telemetryRepo;
        this.redis = redis;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(satelliteRepo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return satelliteRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/health")
    public ResponseEntity<?> getHealth(@PathVariable UUID id) {
        try {
            String cached = redis.opsForValue().get("telemetry:latest:" + id);
            if (cached != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = mapper.readValue(cached, Map.class);
                double score = ((Number) data.getOrDefault("health_score", 0)).doubleValue();
                return ResponseEntity.ok(Map.of(
                        "satellite_id", id,
                        "health_score", score,
                        "status", HealthScorer.classify(score)));
            }
        } catch (Exception ignored) {
        }

        var latest = telemetryRepo.findFirstBySatelliteIdOrderByTimeDesc(id);
        if (latest == null) {
            return ResponseEntity.ok(Map.of("satellite_id", id, "health_score", 0, "status", "unknown"));
        }

        return ResponseEntity.ok(Map.of(
                "satellite_id", id,
                "health_score", latest.getHealthScore(),
                "status", HealthScorer.classify(latest.getHealthScore())));
    }
}
