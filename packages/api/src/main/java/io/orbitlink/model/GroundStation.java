package io.orbitlink.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ground_stations")
public class GroundStation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "elevation_m")
    private Double elevationM = 0.0;

    private Integer capacity = 4;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ONLINE;

    private String region;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum Status {
        ONLINE, DEGRADED, OFFLINE
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double lat) {
        this.latitude = lat;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double lon) {
        this.longitude = lon;
    }

    public Double getElevationM() {
        return elevationM;
    }

    public void setElevationM(Double elev) {
        this.elevationM = elev;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer cap) {
        this.capacity = cap;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
