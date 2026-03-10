package io.orbitlink.service;

import io.orbitlink.model.GroundStation;
import io.orbitlink.model.Telemetry;
import io.orbitlink.repository.GroundStationRepository;
import io.orbitlink.repository.TelemetryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoutingService {

    private static final Logger log = LoggerFactory.getLogger(RoutingService.class);

    private final GroundStationRepository stationRepo;
    private final TelemetryRepository telemetryRepo;

    public RoutingService(GroundStationRepository stationRepo, TelemetryRepository telemetryRepo) {
        this.stationRepo = stationRepo;
        this.telemetryRepo = telemetryRepo;
    }

    public Optional<GroundStation> findBestRoute(UUID satelliteId, UUID excludeStationId) {
        List<GroundStation> stations = stationRepo.findAll().stream()
                .filter(s -> s.getStatus() == GroundStation.Status.ONLINE)
                .filter(s -> !s.getId().equals(excludeStationId))
                .collect(Collectors.toList());

        if (stations.isEmpty())
            return Optional.empty();

        GroundStation best = null;
        double bestWeight = Double.MAX_VALUE;

        for (GroundStation station : stations) {
            List<Telemetry> recent = telemetryRepo.findLatestForLink(
                    satelliteId, station.getId(), PageRequest.of(0, 10));

            double weight;
            if (recent.isEmpty()) {
                weight = 500;
            } else {
                double avgLatency = recent.stream().mapToDouble(t -> t.getLatency() != null ? t.getLatency() : 200)
                        .average().orElse(200);
                double avgLoss = recent.stream().mapToDouble(t -> t.getPacketLoss() != null ? t.getPacketLoss() : 10)
                        .average().orElse(10);
                double avgSignal = recent.stream()
                        .mapToDouble(t -> t.getSignalStrength() != null ? Math.abs(t.getSignalStrength()) : 100)
                        .average().orElse(100);
                double avgHealth = recent.stream()
                        .mapToDouble(t -> t.getHealthScore() != null ? 100 - t.getHealthScore() : 50).average()
                        .orElse(50);

                weight = avgLatency * 0.3 + avgLoss * 3.0 + avgSignal * 0.5 + avgHealth * 1.0;
            }

            if (weight < bestWeight) {
                bestWeight = weight;
                best = station;
            }
        }

        if (best != null) {
            log.info("Best route for satellite {}: station {} (weight: {})",
                    satelliteId, best.getName(), bestWeight);
        }

        return Optional.ofNullable(best);
    }
}
