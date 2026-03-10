package io.orbitlink.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alert_id")
    private UUID alertId;

    @Column(name = "satellite_id")
    private UUID satelliteId;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "action_taken", columnDefinition = "TEXT")
    private String actionTaken;

    @Enumerated(EnumType.STRING)
    private Status status = Status.OPEN;

    @Column(name = "resolution_time_ms")
    private Long resolutionTimeMs;

    @Column(name = "operator_intervention")
    private Boolean operatorIntervention = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public enum Status {
        OPEN, MITIGATING, RESOLVED
    }

    public UUID getId() {
        return id;
    }

    public UUID getAlertId() {
        return alertId;
    }

    public void setAlertId(UUID id) {
        this.alertId = id;
    }

    public UUID getSatelliteId() {
        return satelliteId;
    }

    public void setSatelliteId(UUID id) {
        this.satelliteId = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String t) {
        this.type = t;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String d) {
        this.description = d;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rc) {
        this.rootCause = rc;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String a) {
        this.actionTaken = a;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status s) {
        this.status = s;
    }

    public Long getResolutionTimeMs() {
        return resolutionTimeMs;
    }

    public void setResolutionTimeMs(Long ms) {
        this.resolutionTimeMs = ms;
    }

    public Boolean getOperatorIntervention() {
        return operatorIntervention;
    }

    public void setOperatorIntervention(Boolean oi) {
        this.operatorIntervention = oi;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant t) {
        this.updatedAt = t;
    }
}
