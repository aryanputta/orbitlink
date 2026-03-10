package io.orbitlink.repository;

import io.orbitlink.model.Incident;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    List<Incident> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Incident> findByStatusOrderByCreatedAtDesc(Incident.Status status, Pageable pageable);

    List<Incident> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since);

    @Query("SELECT AVG(i.resolutionTimeMs) FROM Incident i WHERE i.status = 'RESOLVED' AND i.createdAt > :since")
    Double averageResolutionTimeSince(Instant since);
}
