import os
import time
import json
import random
import logging
import requests
from collections import deque

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("orbitlink-edge")

API_URL = os.getenv("API_URL", "http://localhost:4000")
STATION_ID = os.getenv("STATION_ID", "gs-edge-01")
BUFFER_SIZE = int(os.getenv("BUFFER_SIZE", "50"))
FLUSH_INTERVAL = int(os.getenv("FLUSH_INTERVAL", "5"))
COMPRESSION_ENABLED = os.getenv("COMPRESSION_ENABLED", "true").lower() == "true"

buffer = deque(maxlen=BUFFER_SIZE * 2)
failed_queue = deque(maxlen=500)


def preprocess(reading):
    filtered = {k: v for k, v in reading.items() if v is not None}

    if filtered.get("signal_strength", 0) < -115:
        filtered["_low_signal_flag"] = True

    if filtered.get("packet_loss", 0) > 50:
        filtered["_high_loss_flag"] = True

    return filtered


def compress_batch(readings):
    if not COMPRESSION_ENABLED or len(readings) < 3:
        return readings

    compressed = []
    prev = None

    for reading in readings:
        if prev is None:
            compressed.append(reading)
            prev = reading
            continue

        changed = False
        for key in ["signal_strength", "latency", "packet_loss", "bandwidth"]:
            if key in reading and key in prev:
                delta = abs(reading[key] - prev[key])
                threshold = abs(prev[key]) * 0.05 if prev[key] != 0 else 0.5
                if delta > threshold:
                    changed = True
                    break

        if changed or reading.get("_low_signal_flag") or reading.get("_high_loss_flag"):
            compressed.append(reading)
            prev = reading

    return compressed


def flush_buffer():
    if not buffer:
        return

    readings = list(buffer)
    buffer.clear()

    compressed = compress_batch(readings)
    log.info(f"Flushing {len(compressed)}/{len(readings)} readings (compressed)")

    try:
        resp = requests.post(
            f"{API_URL}/api/v1/telemetry/ingest/batch",
            json={"readings": compressed},
            timeout=10,
        )
        if resp.status_code != 202:
            log.warning(f"Flush returned {resp.status_code}")
            failed_queue.extend(compressed)
    except Exception as e:
        log.error(f"Flush failed: {e}")
        failed_queue.extend(compressed)


def retry_failed():
    if not failed_queue:
        return

    batch = []
    while failed_queue and len(batch) < BUFFER_SIZE:
        batch.append(failed_queue.popleft())

    try:
        resp = requests.post(
            f"{API_URL}/api/v1/telemetry/ingest/batch",
            json={"readings": batch},
            timeout=10,
        )
        if resp.status_code != 202:
            failed_queue.extend(batch)
    except Exception:
        failed_queue.extend(batch)


def simulate_edge_readings():
    return {
        "satellite_id": None,
        "station_id": None,
        "signal_strength": round(random.uniform(-110, -65), 2),
        "snr": round(random.uniform(5, 45), 2),
        "latency": round(random.uniform(20, 400), 2),
        "jitter": round(random.uniform(0, 60), 2),
        "packet_loss": round(random.uniform(0, 20), 3),
        "bandwidth": round(random.uniform(1, 90), 2),
        "doppler_shift": round(random.uniform(-5000, 5000), 2),
        "error_rate": round(random.uniform(0, 3), 4),
    }


def run():
    log.info(f"Edge node starting | station={STATION_ID} buffer={BUFFER_SIZE} flush_interval={FLUSH_INTERVAL}s")

    last_flush = time.time()

    while True:
        reading = simulate_edge_readings()
        processed = preprocess(reading)
        buffer.append(processed)

        if time.time() - last_flush >= FLUSH_INTERVAL:
            flush_buffer()
            retry_failed()
            last_flush = time.time()

        time.sleep(0.5)


if __name__ == "__main__":
    run()
