package io.orbitlink.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "satellite_id")
    private UUID satelliteId;

    @Column(name = "station_id")
    private UUID stationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String message;

    private Boolean acknowledged = false;

    @Column(name = "acknowledged_by")
    private UUID acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum Severity {
        INFO, WARNING, CRITICAL
    }

    public UUID getId() {
        return id;
    }

    public UUID getSatelliteId() {
        return satelliteId;
    }

    public void setSatelliteId(UUID id) {
        this.satelliteId = id;
    }

    public UUID getStationId() {
        return stationId;
    }

    public void setStationId(UUID id) {
        this.stationId = id;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity s) {
        this.severity = s;
    }

    public String getType() {
        return type;
    }

    public void setType(String t) {
        this.type = t;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String m) {
        this.message = m;
    }

    public Boolean getAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(Boolean ack) {
        this.acknowledged = ack;
    }

    public UUID getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(UUID id) {
        this.acknowledgedBy = id;
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(Instant t) {
        this.acknowledgedAt = t;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
