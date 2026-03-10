#include "signal_processing.h"
#include <math.h>
#include <stdlib.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static double normalize(double value, double min, double max, int invert) {
  double clamped = fmax(min, fmin(max, value));
  double norm = (clamped - min) / (max - min);
  return invert ? 1.0 - norm : norm;
}

health_result_t compute_health(const telemetry_reading_t *r) {
  health_result_t result;

  result.normalized_signal = normalize(r->signal_strength, -120.0, -60.0, 0);
  result.normalized_latency = normalize(r->latency, 0.0, 500.0, 1);
  result.normalized_loss = normalize(r->packet_loss, 0.0, 100.0, 1);
  result.normalized_bandwidth = normalize(r->bandwidth, 0.0, 100.0, 0);
  result.normalized_jitter = normalize(r->jitter, 0.0, 100.0, 1);

  double score =
      result.normalized_signal * 0.30 + result.normalized_latency * 0.20 +
      result.normalized_loss * 0.20 + result.normalized_bandwidth * 0.15 +
      result.normalized_jitter * 0.15;

  result.health_score = round(score * 100.0);

  if (result.health_score >= 90.0)
    result.status = 0;
  else if (result.health_score >= 70.0)
    result.status = 1;
  else
    result.status = 2;

  return result;
}

double compute_free_space_loss(double frequency_ghz, double distance_km) {
  return 20.0 * log10(distance_km) + 20.0 * log10(frequency_ghz) + 92.45;
}

double compute_doppler_shift(double velocity_ms, double frequency_hz) {
  const double c = 299792458.0;
  return (velocity_ms / c) * frequency_hz;
}

double compute_link_budget(double tx_power_dbm, double tx_gain_db,
                           double rx_gain_db, double path_loss_db,
                           double misc_losses_db) {
  return tx_power_dbm + tx_gain_db + rx_gain_db - path_loss_db - misc_losses_db;
}

double compute_bit_error_rate(double snr_db, int modulation_order) {
  double snr_linear = pow(10.0, snr_db / 10.0);
  double M = (double)modulation_order;
  double sqrt_snr = sqrt(2.0 * snr_linear * (3.0 / (M * M - 1.0)));
  return (2.0 * (M - 1.0) / M) * 0.5 * erfc(sqrt_snr / sqrt(2.0));
}

int detect_anomaly_threshold(const double *values, int count, double mean,
                             double std_dev, double sigma_threshold) {
  int anomalies = 0;
  double upper = mean + sigma_threshold * std_dev;
  double lower = mean - sigma_threshold * std_dev;

  for (int i = 0; i < count; i++) {
    if (values[i] > upper || values[i] < lower)
      anomalies++;
  }
  return anomalies;
}

void moving_average(const double *input, double *output, int count,
                    int window) {
  int half = window / 2;
  for (int i = 0; i < count; i++) {
    double sum = 0;
    int n = 0;
    for (int j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < count) {
        sum += input[j];
        n++;
      }
    }
    output[i] = sum / n;
  }
}

void exponential_smooth(const double *input, double *output, int count,
                        double alpha) {
  if (count == 0)
    return;
  output[0] = input[0];
  for (int i = 1; i < count; i++) {
    output[i] = alpha * input[i] + (1.0 - alpha) * output[i - 1];
  }
}

int fft_power_spectrum(const double *signal, spectral_bin_t *output,
                       int n_samples, double sample_rate) {
  if (n_samples <= 0 || (n_samples & (n_samples - 1)) != 0)
    return -1;

  double *real = (double *)calloc(n_samples, sizeof(double));
  double *imag = (double *)calloc(n_samples, sizeof(double));
  if (!real || !imag) {
    free(real);
    free(imag);
    return -1;
  }

  memcpy(real, signal, n_samples * sizeof(double));

  for (int s = 1; s < n_samples; s <<= 1) {
    for (int k = 0; k < n_samples; k += s << 1) {
      for (int j = 0; j < s; j++) {
        double angle = -M_PI * j / s;
        double wr = cos(angle);
        double wi = sin(angle);

        int even = k + j;
        int odd = k + j + s;

        double tr = wr * real[odd] - wi * imag[odd];
        double ti = wr * imag[odd] + wi * real[odd];

        real[odd] = real[even] - tr;
        imag[odd] = imag[even] - ti;
        real[even] += tr;
        imag[even] += ti;
      }
    }
  }

  int n_bins = n_samples / 2;
  for (int i = 0; i < n_bins; i++) {
    output[i].magnitude =
        sqrt(real[i] * real[i] + imag[i] * imag[i]) / n_samples;
    output[i].phase = atan2(imag[i], real[i]);
    output[i].frequency = (double)i * sample_rate / n_samples;
  }

  free(real);
  free(imag);
  return n_bins;
}
