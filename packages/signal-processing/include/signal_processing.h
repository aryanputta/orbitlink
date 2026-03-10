#ifndef ORBITLINK_SIGNAL_H
#define ORBITLINK_SIGNAL_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    double signal_strength;
    double snr;
    double latency;
    double jitter;
    double packet_loss;
    double bandwidth;
    double doppler_shift;
    double error_rate;
} telemetry_reading_t;

typedef struct {
    double health_score;
    int status;  /* 0=healthy, 1=degraded, 2=critical */
    double normalized_signal;
    double normalized_latency;
    double normalized_loss;
    double normalized_bandwidth;
    double normalized_jitter;
} health_result_t;

typedef struct {
    double magnitude;
    double phase;
    double frequency;
} spectral_bin_t;

health_result_t compute_health(const telemetry_reading_t *reading);

double compute_free_space_loss(double frequency_ghz, double distance_km);

double compute_doppler_shift(double velocity_ms, double frequency_hz);

double compute_link_budget(double tx_power_dbm, double tx_gain_db,
                            double rx_gain_db, double path_loss_db,
                            double misc_losses_db);

double compute_bit_error_rate(double snr_db, int modulation_order);

int detect_anomaly_threshold(const double *values, int count,
                              double mean, double std_dev,
                              double sigma_threshold);

void moving_average(const double *input, double *output, int count, int window);

void exponential_smooth(const double *input, double *output, int count, double alpha);

int fft_power_spectrum(const double *signal, spectral_bin_t *output,
                        int n_samples, double sample_rate);

#ifdef __cplusplus
}
#endif

#endif
