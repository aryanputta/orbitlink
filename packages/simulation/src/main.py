import os
import time
import json
import logging
import requests
from datetime import datetime, timezone

from .orbital import propagate
from .ground_stations import find_visible_stations, select_best_station
from .telemetry_gen import generate_telemetry
from .scenarios import create_all_scenarios

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("orbitlink-sim")

API_URL = os.getenv("API_URL", "http://localhost:4000")
INTERVAL_MS = int(os.getenv("INTERVAL_MS", "1000"))

SATELLITES = [
    {"id": "OL-SAT-01", "tle1": "1 25544U 98067A   24001.00000000  .00016717  00000-0  10270-3 0  9002", "tle2": "2 25544  51.6400 208.9163 0006703  40.5765 319.5681 15.49297436484041"},
    {"id": "OL-SAT-02", "tle1": "1 41866U 16071A   24001.00000000  .00000150  00000-0  72000-5 0  9004", "tle2": "2 41866  97.4500  92.2100 0014500 120.0000 240.2000 15.22000000 50000"},
    {"id": "OL-SAT-03", "tle1": "1 43013U 17073A   24001.00000000  .00001200  00000-0  60000-4 0  9006", "tle2": "2 43013  53.0000 170.0000 0001500  80.0000 280.1000 15.06000000 38000"},
    {"id": "OL-SAT-04", "tle1": "1 44713U 19074A   24001.00000000  .00001100  00000-0  55000-4 0  9008", "tle2": "2 44713  53.0000  50.0000 0001800 150.0000  10.1000 15.06000000 28000"},
    {"id": "OL-SAT-05", "tle1": "1 46114U 20055A   24001.00000000  .00000080  00000-0  35000-5 0  9010", "tle2": "2 46114  70.0000 310.0000 0012000 200.0000 160.0000 14.80000000 22000"},
    {"id": "OL-SAT-06", "tle1": "1 48274U 21035A   24001.00000000  .00000120  00000-0  58000-5 0  9012", "tle2": "2 48274  97.6000 140.0000 0008000  90.0000 270.2000 15.00000000 18000"},
    {"id": "OL-SAT-07", "tle1": "1 49260U 21090A   24001.00000000  .00002000  00000-0  85000-4 0  9014", "tle2": "2 49260  45.0000 260.0000 0003000 170.0000  90.1000 15.12000000 15000"},
    {"id": "OL-SAT-08", "tle1": "1 51082U 22002A   24001.00000000  .00000060  00000-0  30000-5 0  9016", "tle2": "2 51082  87.9000  20.0000 0015000 300.0000  60.0000 14.85000000 12000"},
    {"id": "OL-SAT-09", "tle1": "1 53239U 22120A   24001.00000000  .00001500  00000-0  70000-4 0  9018", "tle2": "2 53239  42.0000 180.0000 0002000 220.0000 140.0000 15.05000000  9000"},
    {"id": "OL-SAT-10", "tle1": "1 55021U 23015A   24001.00000000  .00000200  00000-0  90000-5 0  9020", "tle2": "2 55021  60.0000 100.0000 0010000  40.0000 320.0000 14.95000000  6000"},
    {"id": "OL-SAT-11", "tle1": "1 56789U 23080A   24001.00000000  .00000050  00000-0  25000-5 0  9022", "tle2": "2 56789  98.2000 240.0000 0018000 110.0000 250.2000 14.75000000  4000"},
    {"id": "OL-SAT-12", "tle1": "1 58124U 24005A   24001.00000000  .00001000  00000-0  50000-4 0  9024", "tle2": "2 58124  55.0000 330.0000 0005000 260.0000  99.8000 15.03000000  2000"},
]


def fetch_entity_ids():
    try:
        sats = requests.get(f"{API_URL}/api/v1/satellites", timeout=5).json()
        stations = requests.get(f"{API_URL}/api/v1/stations", timeout=5).json()
        sat_map = {s["name"]: s["id"] for s in sats}
        station_map = {s["name"]: s["id"] for s in stations}
        return sat_map, station_map
    except Exception as e:
        log.warning(f"Could not fetch entity IDs: {e}")
        return {}, {}


def run_simulation():
    log.info("Starting orbital simulation engine")
    log.info(f"Tracking {len(SATELLITES)} satellites, interval={INTERVAL_MS}ms")

    scenarios = create_all_scenarios()
    station_outage = scenarios[1]
    congestion = {}

    sat_map, station_map = {}, {}
    retry_count = 0

    while not sat_map and retry_count < 30:
        sat_map, station_map = fetch_entity_ids()
        if not sat_map:
            retry_count += 1
            log.info(f"Waiting for API... attempt {retry_count}/30")
            time.sleep(2)

    if not sat_map:
        log.error("Failed to connect to API after 30 attempts")
        return

    log.info(f"Connected to API. Satellites: {len(sat_map)}, Stations: {len(station_map)}")

    while True:
        tick_start = time.time()

        for scenario in scenarios:
            scenario.try_activate()
            scenario.tick()

        active = [s.name for s in scenarios if s.active]
        if active:
            log.info(f"Active scenarios: {', '.join(active)}")

        batch = []
        now = datetime.now(timezone.utc)

        for sat in SATELLITES:
            position = propagate(sat["tle1"], sat["tle2"], now)
            if not position:
                continue

            visible = find_visible_stations(
                position["latitude"], position["longitude"], position["altitude_km"]
            )

            visible = [
                s for i, s in enumerate(visible)
                if not station_outage.is_station_down(i)
            ]

            station = select_best_station(visible, congestion)
            if not station:
                continue

            sat_uuid = sat_map.get(sat["id"])
            station_uuid = station_map.get(station["name"])
            if not sat_uuid or not station_uuid:
                continue

            telemetry = generate_telemetry(
                position, station, congestion.get(station["name"], 0)
            )

            for scenario in scenarios:
                if scenario != station_outage:
                    telemetry = scenario.apply(telemetry)

            telemetry["satellite_id"] = sat_uuid
            telemetry["station_id"] = station_uuid
            batch.append(telemetry)

        if batch:
            try:
                resp = requests.post(
                    f"{API_URL}/api/v1/telemetry/ingest/batch",
                    json={"readings": batch},
                    timeout=5,
                )
                if resp.status_code == 202:
                    log.debug(f"Ingested {len(batch)} readings")
                else:
                    log.warning(f"Ingest returned {resp.status_code}")
            except Exception as e:
                log.error(f"Ingest failed: {e}")

        elapsed = time.time() - tick_start
        sleep_time = max(0, (INTERVAL_MS / 1000.0) - elapsed)
        time.sleep(sleep_time)


if __name__ == "__main__":
    run_simulation()
