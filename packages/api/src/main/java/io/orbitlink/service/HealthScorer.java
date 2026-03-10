package io.orbitlink.service;

public class HealthScorer {

    private static final double W_SIGNAL = 0.30;
    private static final double W_LATENCY = 0.20;
    private static final double W_PACKET_LOSS = 0.20;
    private static final double W_BANDWIDTH = 0.15;
    private static final double W_JITTER = 0.15;

    public static double compute(double signalStrength, double latency, double packetLoss,
            double bandwidth, double jitter) {
        double normSignal = normalize(signalStrength, -120, -60, false);
        double normLatency = normalize(latency, 0, 500, true);
        double normPacketLoss = normalize(packetLoss, 0, 100, true);
        double normBandwidth = normalize(bandwidth, 0, 100, false);
        double normJitter = normalize(jitter, 0, 100, true);

        double score = normSignal * W_SIGNAL
                + normLatency * W_LATENCY
                + normPacketLoss * W_PACKET_LOSS
                + normBandwidth * W_BANDWIDTH
                + normJitter * W_JITTER;

        return Math.round(score * 100);
    }

    public static String classify(double score) {
        if (score >= 90)
            return "healthy";
        if (score >= 70)
            return "degraded";
        return "critical";
    }

    private static double normalize(double value, double min, double max, boolean invert) {
        double clamped = Math.max(min, Math.min(max, value));
        double normalized = (clamped - min) / (max - min);
        return invert ? 1 - normalized : normalized;
    }
}
