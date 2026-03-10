#include "signal_processing.h"
#include <assert.h>
#include <math.h>
#include <stdio.h>

static int tests_run = 0;
static int tests_passed = 0;

#define ASSERT_NEAR(actual, expected, tolerance)                               \
  do {                                                                         \
    tests_run++;                                                               \
    if (fabs((actual) - (expected)) <= (tolerance)) {                          \
      tests_passed++;                                                          \
    } else {                                                                   \
      printf("  FAIL: expected %.4f, got %.4f\n", (expected), (actual));       \
    }                                                                          \
  } while (0)

void test_health_scoring(void) {
  printf("Testing health scoring...\n");

  telemetry_reading_t healthy = {.signal_strength = -70.0,
                                 .snr = 40.0,
                                 .latency = 50.0,
                                 .jitter = 5.0,
                                 .packet_loss = 0.5,
                                 .bandwidth = 80.0,
                                 .doppler_shift = 100.0,
                                 .error_rate = 0.01};
  health_result_t r = compute_health(&healthy);
  ASSERT_NEAR(r.status, 0, 0.01);
  printf("  Healthy link: score=%.0f status=%d\n", r.health_score, r.status);

  telemetry_reading_t degraded = {.signal_strength = -95.0,
                                  .snr = 20.0,
                                  .latency = 250.0,
                                  .jitter = 40.0,
                                  .packet_loss = 10.0,
                                  .bandwidth = 30.0,
                                  .doppler_shift = 500.0,
                                  .error_rate = 1.0};
  r = compute_health(&degraded);
  printf("  Degraded link: score=%.0f status=%d\n", r.health_score, r.status);

  telemetry_reading_t critical = {.signal_strength = -115.0,
                                  .snr = 5.0,
                                  .latency = 450.0,
                                  .jitter = 90.0,
                                  .packet_loss = 60.0,
                                  .bandwidth = 5.0,
                                  .doppler_shift = 2000.0,
                                  .error_rate = 15.0};
  r = compute_health(&critical);
  ASSERT_NEAR(r.status, 2, 0.01);
  printf("  Critical link: score=%.0f status=%d\n", r.health_score, r.status);
}

void test_link_budget(void) {
  printf("Testing link budget...\n");
  double fspl = compute_free_space_loss(12.0, 500.0);
  printf("  FSPL at 12 GHz, 500 km: %.2f dB\n", fspl);
  ASSERT_NEAR(fspl, 168.01, 0.5);

  double budget = compute_link_budget(40.0, 30.0, 35.0, fspl, 3.0);
  printf("  Link budget: %.2f dBm\n", budget);
}

void test_doppler(void) {
  printf("Testing Doppler shift...\n");
  double shift = compute_doppler_shift(7500.0, 12e9);
  printf("  Doppler at 7.5 km/s, 12 GHz: %.2f Hz\n", shift);
  ASSERT_NEAR(shift, 300120.48, 500.0);
}

void test_ber(void) {
  printf("Testing BER computation...\n");
  double ber = compute_bit_error_rate(20.0, 4);
  printf("  BER at 20dB SNR, QPSK: %e\n", ber);

  double ber_low = compute_bit_error_rate(5.0, 4);
  printf("  BER at 5dB SNR, QPSK: %e\n", ber_low);
}

void test_smoothing(void) {
  printf("Testing signal smoothing...\n");
  double input[] = {10, 12, 80, 14, 11, 13, 90, 15, 12, 14};
  double output[10];

  moving_average(input, output, 10, 3);
  printf("  Moving avg: ");
  for (int i = 0; i < 10; i++)
    printf("%.1f ", output[i]);
  printf("\n");

  exponential_smooth(input, output, 10, 0.3);
  printf("  Exp smooth: ");
  for (int i = 0; i < 10; i++)
    printf("%.1f ", output[i]);
  printf("\n");
}

void test_anomaly_detection(void) {
  printf("Testing anomaly detection...\n");
  double values[] = {100, 102, 101, 99, 250, 103, 98, 300, 101, 100};
  int count = detect_anomaly_threshold(values, 10, 100.0, 5.0, 3.0);
  printf("  Anomalies detected (3-sigma): %d\n", count);
  ASSERT_NEAR(count, 2, 0.01);
}

int main(void) {
  printf("=== OrbitLink Signal Processing Tests ===\n\n");

  test_health_scoring();
  test_link_budget();
  test_doppler();
  test_ber();
  test_smoothing();
  test_anomaly_detection();

  printf("\n=== Results: %d/%d passed ===\n", tests_passed, tests_run);
  return tests_passed == tests_run ? 0 : 1;
}
