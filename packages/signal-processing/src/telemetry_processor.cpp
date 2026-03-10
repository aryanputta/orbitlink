#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <deque>
#include <functional>
#include <iostream>
#include <map>
#include <mutex>
#include <numeric>
#include <queue>
#include <thread>
#include <vector>

extern "C" {
#include "signal_processing.h"
}

struct TelemetryPacket {
  uint64_t timestamp_us;
  uint32_t satellite_id;
  uint32_t station_id;
  telemetry_reading_t reading;
  health_result_t health;
  bool anomaly_flag;
  double failure_probability;
};

class RingBuffer {
  std::vector<TelemetryPacket> buffer;
  size_t head = 0;
  size_t count = 0;
  std::mutex mtx;

public:
  explicit RingBuffer(size_t capacity) : buffer(capacity) {}

  void push(const TelemetryPacket &packet) {
    std::lock_guard<std::mutex> lock(mtx);
    buffer[head] = packet;
    head = (head + 1) % buffer.size();
    if (count < buffer.size())
      count++;
  }

  std::vector<TelemetryPacket> snapshot(size_t n) {
    std::lock_guard<std::mutex> lock(mtx);
    std::vector<TelemetryPacket> result;
    size_t take = std::min(n, count);
    for (size_t i = 0; i < take; i++) {
      size_t idx = (head - 1 - i + buffer.size()) % buffer.size();
      result.push_back(buffer[idx]);
    }
    return result;
  }

  size_t size() {
    std::lock_guard<std::mutex> lock(mtx);
    return count;
  }
};

class TrendAnalyzer {
  std::deque<double> window;
  size_t max_size;

public:
  explicit TrendAnalyzer(size_t window_size) : max_size(window_size) {}

  void add(double value) {
    window.push_back(value);
    if (window.size() > max_size)
      window.pop_front();
  }

  double mean() const {
    if (window.empty())
      return 0;
    return std::accumulate(window.begin(), window.end(), 0.0) / window.size();
  }

  double std_dev() const {
    if (window.size() < 2)
      return 0;
    double m = mean();
    double sq_sum = 0;
    for (double v : window)
      sq_sum += (v - m) * (v - m);
    return std::sqrt(sq_sum / (window.size() - 1));
  }

  double slope() const {
    if (window.size() < 2)
      return 0;
    double x_mean = (window.size() - 1) / 2.0;
    double y_mean = mean();
    double num = 0, den = 0;
    for (size_t i = 0; i < window.size(); i++) {
      num += (i - x_mean) * (window[i] - y_mean);
      den += (i - x_mean) * (i - x_mean);
    }
    return den != 0 ? num / den : 0;
  }

  bool is_anomaly(double value, double sigma = 3.0) const {
    double m = mean();
    double s = std_dev();
    return s > 0 && std::abs(value - m) > sigma * s;
  }
};

class TelemetryProcessor {
  RingBuffer history;
  std::map<uint32_t, TrendAnalyzer> latency_trends;
  std::map<uint32_t, TrendAnalyzer> signal_trends;
  std::map<uint32_t, TrendAnalyzer> loss_trends;
  std::atomic<uint64_t> packets_processed{0};
  std::atomic<uint64_t> anomalies_detected{0};

  static constexpr size_t TREND_WINDOW = 60;

public:
  TelemetryProcessor() : history(10000) {}

  TelemetryPacket process(uint32_t sat_id, uint32_t station_id,
                          const telemetry_reading_t &raw) {
    TelemetryPacket packet;
    auto now = std::chrono::high_resolution_clock::now();
    packet.timestamp_us = std::chrono::duration_cast<std::chrono::microseconds>(
                              now.time_since_epoch())
                              .count();
    packet.satellite_id = sat_id;
    packet.station_id = station_id;
    packet.reading = raw;

    packet.health = compute_health(&raw);

    auto &lat_trend =
        latency_trends.try_emplace(sat_id, TREND_WINDOW).first->second;
    auto &sig_trend =
        signal_trends.try_emplace(sat_id, TREND_WINDOW).first->second;
    auto &loss_trend =
        loss_trends.try_emplace(sat_id, TREND_WINDOW).first->second;

    lat_trend.add(raw.latency);
    sig_trend.add(raw.signal_strength);
    loss_trend.add(raw.packet_loss);

    packet.anomaly_flag = lat_trend.is_anomaly(raw.latency) ||
                          sig_trend.is_anomaly(raw.signal_strength) ||
                          loss_trend.is_anomaly(raw.packet_loss);

    double lat_risk = std::max(0.0, (raw.latency - 200.0) / 300.0);
    double loss_risk = std::max(0.0, (raw.packet_loss - 10.0) / 30.0);
    double sig_risk = std::max(0.0, (-raw.signal_strength - 100.0) / 20.0);
    double trend_risk = std::max(0.0, sig_trend.slope() < -1.0 ? 0.3 : 0.0);

    packet.failure_probability =
        std::min(1.0, 0.3 * loss_risk + 0.25 * lat_risk + 0.25 * sig_risk +
                          0.2 * trend_risk);

    if (packet.anomaly_flag)
      anomalies_detected++;
    packets_processed++;

    history.push(packet);
    return packet;
  }

  uint64_t total_processed() const { return packets_processed.load(); }
  uint64_t total_anomalies() const { return anomalies_detected.load(); }
};

int main() {
  std::cout << "OrbitLink C++ Telemetry Processor" << std::endl;
  std::cout << "=================================" << std::endl;

  TelemetryProcessor processor;

  telemetry_reading_t readings[] = {
      {-75.0, 35.0, 80.0, 8.0, 1.0, 70.0, 150.0, 0.01},
      {-82.0, 28.0, 120.0, 15.0, 3.0, 55.0, 300.0, 0.05},
      {-95.0, 18.0, 250.0, 40.0, 12.0, 25.0, 800.0, 0.8},
      {-110.0, 6.0, 420.0, 85.0, 55.0, 8.0, 2000.0, 8.0},
      {-78.0, 32.0, 95.0, 10.0, 2.0, 65.0, 200.0, 0.02},
  };

  const char *labels[] = {"Nominal", "Moderate", "Degraded", "Critical",
                          "Recovery"};

  for (int i = 0; i < 5; i++) {
    auto result = processor.process(1, 1, readings[i]);
    std::cout << "\n[" << labels[i] << "]"
              << " Health: " << result.health.health_score
              << " Status: " << result.health.status
              << " Failure P: " << result.failure_probability
              << " Anomaly: " << (result.anomaly_flag ? "YES" : "no")
              << std::endl;
  }

  std::cout << "\nProcessed: " << processor.total_processed()
            << " Anomalies: " << processor.total_anomalies() << std::endl;

  return 0;
}
