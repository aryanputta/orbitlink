package io.orbitlink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.orbitlink.model.Telemetry;
import io.orbitlink.repository.TelemetryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;

@Service
public class TelemetryPipeline {

    private static final Logger log = LoggerFactory.getLogger(TelemetryPipeline.class);

    private final TelemetryRepository telemetryRepo;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final StringRedisTemplate redis;
    private final SimpMessagingTemplate websocket;
    private final AnomalyService anomalyService;
    private final ObjectMapper mapper = new ObjectMapper();

    public TelemetryPipeline(TelemetryRepository telemetryRepo,
            KafkaTemplate<String, String> kafkaTemplate,
            StringRedisTemplate redis,
            SimpMessagingTemplate websocket,
            AnomalyService anomalyService) {
        this.telemetryRepo = telemetryRepo;
        this.kafkaTemplate = kafkaTemplate;
        this.redis = redis;
        this.websocket = websocket;
        this.anomalyService = anomalyService;
    }

    public void ingest(Map<String, Object> reading) {
        try {
            String json = mapper.writeValueAsString(reading);
            String satelliteId = reading.get("satellite_id").toString();
            kafkaTemplate.send("telemetry.raw", satelliteId, json);
        } catch (Exception e) {
            log.error("Failed to publish telemetry to Kafka", e);
        }
    }

    @KafkaListener(topics = "telemetry.raw", groupId = "orbitlink-processors")
    public void process(String message) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> reading = mapper.readValue(message, Map.class);

            double healthScore = HealthScorer.compute(
                    toDouble(reading.get("signal_strength")),
                    toDouble(reading.get("latency")),
                    toDouble(reading.get("packet_loss")),
                    toDouble(reading.get("bandwidth")),
                    toDouble(reading.get("jitter")));

            Telemetry t = new Telemetry();
            t.setSatelliteId(java.util.UUID.fromString(reading.get("satellite_id").toString()));
            t.setStationId(java.util.UUID.fromString(reading.get("station_id").toString()));
            t.setSignalStrength(toDouble(reading.get("signal_strength")));
            t.setSnr(toDouble(reading.get("snr")));
            t.setLatency(toDouble(reading.get("latency")));
            t.setJitter(toDouble(reading.get("jitter")));
            t.setPacketLoss(toDouble(reading.get("packet_loss")));
            t.setBandwidth(toDouble(reading.get("bandwidth")));
            t.setDopplerShift(toDouble(reading.get("doppler_shift")));
            t.setErrorRate(toDouble(reading.get("error_rate")));
            t.setHealthScore(healthScore);

            telemetryRepo.save(t);

            reading.put("health_score", healthScore);
            String cacheKey = "telemetry:latest:" + reading.get("satellite_id");
            redis.opsForValue().set(cacheKey, mapper.writeValueAsString(reading), Duration.ofSeconds(30));

            websocket.convertAndSend("/topic/telemetry/" + reading.get("satellite_id"), reading);
            websocket.convertAndSend("/topic/telemetry/all", reading);

            anomalyService.evaluate(reading);

        } catch (Exception e) {
            log.error("Failed to process telemetry", e);
        }
    }

    private double toDouble(Object val) {
        if (val == null)
            return 0;
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }
}
