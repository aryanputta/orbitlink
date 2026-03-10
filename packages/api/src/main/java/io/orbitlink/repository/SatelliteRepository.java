package io.orbitlink.repository;

import io.orbitlink.model.Satellite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SatelliteRepository extends JpaRepository<Satellite, UUID> {
}
