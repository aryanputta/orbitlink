package io.orbitlink.repository;

import io.orbitlink.model.GroundStation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GroundStationRepository extends JpaRepository<GroundStation, UUID> {
}
