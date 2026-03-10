package io.orbitlink.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "satellites")
public class Satellite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "norad_id", unique = true)
    private Integer noradId;

    @Column(name = "tle_line1", columnDefinition = "TEXT")
    private String tleLine1;

    @Column(name = "tle_line2", columnDefinition = "TEXT")
    private String tleLine2;

    private Double inclination;

    @Column(name = "altitude_km")
    private Double altitudeKm;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum Status {
        ACTIVE, DEGRADED, OFFLINE
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getNoradId() {
        return noradId;
    }

    public void setNoradId(Integer noradId) {
        this.noradId = noradId;
    }

    public String getTleLine1() {
        return tleLine1;
    }

    public void setTleLine1(String tle) {
        this.tleLine1 = tle;
    }

    public String getTleLine2() {
        return tleLine2;
    }

    public void setTleLine2(String tle) {
        this.tleLine2 = tle;
    }

    public Double getInclination() {
        return inclination;
    }

    public void setInclination(Double inc) {
        this.inclination = inc;
    }

    public Double getAltitudeKm() {
        return altitudeKm;
    }

    public void setAltitudeKm(Double alt) {
        this.altitudeKm = alt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
