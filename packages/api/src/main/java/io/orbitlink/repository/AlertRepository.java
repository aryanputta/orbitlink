package io.orbitlink.repository;

import io.orbitlink.model.Alert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByAcknowledgedOrderByCreatedAtDesc(Boolean acknowledged, Pageable pageable);

    List<Alert> findBySeverityOrderByCreatedAtDesc(Alert.Severity severity, Pageable pageable);

    List<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countBySeverityAndCreatedAtAfter(Alert.Severity severity, Instant since);
}
