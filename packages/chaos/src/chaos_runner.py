import os
import time
import random
import logging
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("orbitlink-chaos")

API_URL = os.getenv("API_URL", "http://localhost:4000")


def satellite_outage(duration_s=30):
    log.info(f"CHAOS: Simulating satellite outage for {duration_s}s")
    sats = requests.get(f"{API_URL}/api/v1/satellites").json()
    if not sats:
        return

    target = random.choice(sats)
    log.info(f"CHAOS: Target satellite: {target['name']}")

    for _ in range(duration_s):
        try:
            requests.post(f"{API_URL}/api/v1/telemetry/ingest", json={
                "satellite_id": target["id"],
                "station_id": sats[0].get("id", target["id"]),
                "signal_strength": -119,
                "snr": 1,
                "latency": 999,
                "jitter": 200,
                "packet_loss": 95,
                "bandwidth": 0.1,
                "doppler_shift": 0,
                "error_rate": 50,
            })
        except Exception:
            pass
        time.sleep(1)

    log.info("CHAOS: Satellite outage ended")


def latency_spike(duration_s=20):
    log.info(f"CHAOS: Injecting latency spike for {duration_s}s")
    sats = requests.get(f"{API_URL}/api/v1/satellites").json()
    stations = requests.get(f"{API_URL}/api/v1/stations").json()
    if not sats or not stations:
        return

    for _ in range(duration_s):
        sat = random.choice(sats)
        station = random.choice(stations)
        try:
            requests.post(f"{API_URL}/api/v1/telemetry/ingest", json={
                "satellite_id": sat["id"],
                "station_id": station["id"],
                "signal_strength": round(random.uniform(-95, -80), 2),
                "snr": round(random.uniform(10, 20), 2),
                "latency": round(random.uniform(400, 900), 2),
                "jitter": round(random.uniform(80, 200), 2),
                "packet_loss": round(random.uniform(5, 20), 2),
                "bandwidth": round(random.uniform(5, 30), 2),
                "doppler_shift": 0,
                "error_rate": round(random.uniform(1, 10), 2),
            })
        except Exception:
            pass
        time.sleep(1)

    log.info("CHAOS: Latency spike ended")


def packet_corruption_burst(duration_s=15):
    log.info(f"CHAOS: Packet corruption burst for {duration_s}s")
    sats = requests.get(f"{API_URL}/api/v1/satellites").json()
    stations = requests.get(f"{API_URL}/api/v1/stations").json()
    if not sats or not stations:
        return

    for _ in range(duration_s):
        sat = random.choice(sats)
        station = random.choice(stations)
        try:
            requests.post(f"{API_URL}/api/v1/telemetry/ingest", json={
                "satellite_id": sat["id"],
                "station_id": station["id"],
                "signal_strength": round(random.uniform(-90, -75), 2),
                "snr": round(random.uniform(8, 15), 2),
                "latency": round(random.uniform(100, 250), 2),
                "jitter": round(random.uniform(30, 80), 2),
                "packet_loss": round(random.uniform(30, 80), 2),
                "bandwidth": round(random.uniform(10, 40), 2),
                "doppler_shift": 0,
                "error_rate": round(random.uniform(5, 25), 2),
            })
        except Exception:
            pass
        time.sleep(1)

    log.info("CHAOS: Packet corruption ended")


SCENARIOS = {
    "satellite_outage": satellite_outage,
    "latency_spike": latency_spike,
    "packet_corruption": packet_corruption_burst,
}


def run_random_chaos(rounds=5, cooldown_s=30):
    log.info(f"Starting chaos run: {rounds} rounds, {cooldown_s}s cooldown")
    for i in range(rounds):
        scenario_name = random.choice(list(SCENARIOS.keys()))
        log.info(f"Round {i+1}/{rounds}: {scenario_name}")
        SCENARIOS[scenario_name]()
        log.info(f"Cooldown {cooldown_s}s...")
        time.sleep(cooldown_s)
    log.info("Chaos run complete")


if __name__ == "__main__":
    run_random_chaos()
