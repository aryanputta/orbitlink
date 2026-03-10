package io.orbitlink.controller;

import io.orbitlink.service.TelemetryPipeline;
import io.orbitlink.repository.TelemetryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/telemetry")
public class TelemetryController {

    private final TelemetryPipeline pipeline;
    private final TelemetryRepository telemetryRepo;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper = new ObjectMapper();

    public TelemetryController(TelemetryPipeline pipeline, TelemetryRepository telemetryRepo,
            StringRedisTemplate redis) {
        this.pipeline = pipeline;
        this.telemetryRepo = telemetryRepo;
        this.redis = redis;
    }

    @PostMapping("/ingest")
    public ResponseEntity<?> ingest(@RequestBody Map<String, Object> reading) {
        pipeline.ingest(reading);
        return ResponseEntity.accepted().body(Map.of("status", "accepted"));
    }

    @PostMapping("/ingest/batch")
    public ResponseEntity<?> ingestBatch(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> readings = (List<Map<String, Object>>) body.get("readings");
        if (readings != null) {
            readings.forEach(pipeline::ingest);
        }
        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "count", readings != null ? readings.size() : 0));
    }

    @GetMapping("/{satelliteId}/latest")
    public ResponseEntity<?> getLatest(@PathVariable UUID satelliteId) {
        try {
            String cached = redis.opsForValue().get("telemetry:latest:" + satelliteId);
            if (cached != null) {
                return ResponseEntity.ok(mapper.readValue(cached, Map.class));
            }
        } catch (Exception ignored) {
        }

        var latest = telemetryRepo.findFirstBySatelliteIdOrderByTimeDesc(satelliteId);
        if (latest == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(latest);
    }

    @GetMapping("/{satelliteId}")
    public ResponseEntity<?> getHistory(@PathVariable UUID satelliteId,
            @RequestParam(defaultValue = "100") int limit) {
        var data = telemetryRepo.findBySatelliteIdOrderByTimeDesc(
                satelliteId, PageRequest.of(0, limit));
        return ResponseEntity.ok(data);
    }
}
