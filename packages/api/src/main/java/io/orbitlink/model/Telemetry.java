package io.orbitlink.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "telemetry")
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Instant time = Instant.now();

    @Column(name = "satellite_id", nullable = false)
    private UUID satelliteId;

    @Column(name = "station_id", nullable = false)
    private UUID stationId;

    @Column(name = "signal_strength")
    private Double signalStrength;

    private Double snr;
    private Double latency;
    private Double jitter;

    @Column(name = "packet_loss")
    private Double packetLoss;

    private Double bandwidth;

    @Column(name = "doppler_shift")
    private Double dopplerShift;

    @Column(name = "error_rate")
    private Double errorRate;

    @Column(name = "health_score")
    private Double healthScore;

    public UUID getId() {
        return id;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
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

    public Double getSignalStrength() {
        return signalStrength;
    }

    public void setSignalStrength(Double v) {
        this.signalStrength = v;
    }

    public Double getSnr() {
        return snr;
    }

    public void setSnr(Double v) {
        this.snr = v;
    }

    public Double getLatency() {
        return latency;
    }

    public void setLatency(Double v) {
        this.latency = v;
    }

    public Double getJitter() {
        return jitter;
    }

    public void setJitter(Double v) {
        this.jitter = v;
    }

    public Double getPacketLoss() {
        return packetLoss;
    }

    public void setPacketLoss(Double v) {
        this.packetLoss = v;
    }

    public Double getBandwidth() {
        return bandwidth;
    }

    public void setBandwidth(Double v) {
        this.bandwidth = v;
    }

    public Double getDopplerShift() {
        return dopplerShift;
    }

    public void setDopplerShift(Double v) {
        this.dopplerShift = v;
    }

    public Double getErrorRate() {
        return errorRate;
    }

    public void setErrorRate(Double v) {
        this.errorRate = v;
    }

    public Double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Double v) {
        this.healthScore = v;
    }
}
