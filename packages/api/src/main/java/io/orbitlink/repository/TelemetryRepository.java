package io.orbitlink.repository;

import io.orbitlink.model.Telemetry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TelemetryRepository extends JpaRepository<Telemetry, UUID> {

    List<Telemetry> findBySatelliteIdOrderByTimeDesc(UUID satelliteId, Pageable pageable);

    Telemetry findFirstBySatelliteIdOrderByTimeDesc(UUID satelliteId);

    List<Telemetry> findBySatelliteIdAndTimeBetweenOrderByTimeDesc(
            UUID satelliteId, Instant from, Instant to);

    @Query("SELECT t FROM Telemetry t WHERE t.satelliteId = :satId AND t.stationId = :stationId ORDER BY t.time DESC")
    List<Telemetry> findLatestForLink(UUID satId, UUID stationId, Pageable pageable);

    @Query("SELECT AVG(t.healthScore) FROM Telemetry t WHERE t.satelliteId = :satId AND t.time > :since")
    Double averageHealthSince(UUID satId, Instant since);

    long countByTimeAfter(Instant since);

    long countByHealthScoreGreaterThanEqualAndTimeAfter(Double score, Instant since);
}
