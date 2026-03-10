import math
import random
import numpy as np


def generate_signal_strength(elevation, base_power=-70, noise_floor=-120):
    path_loss = 20 * math.log10(max(elevation, 1)) - 10
    atmospheric = random.gauss(0, 2)
    return max(noise_floor, base_power + path_loss + atmospheric)


def generate_snr(signal_strength, noise_floor=-120):
    return max(0, signal_strength - noise_floor + random.gauss(0, 1.5))


def generate_latency(altitude_km, elevation):
    propagation = (altitude_km * 2) / 300
    processing = random.uniform(5, 20)
    atmospheric = max(0, (90 - elevation) * 0.5)
    jitter_component = abs(random.gauss(0, 10))
    return propagation + processing + atmospheric + jitter_component


def generate_jitter(base_latency):
    return abs(random.gauss(0, base_latency * 0.15))


def generate_packet_loss(elevation, signal_strength):
    if signal_strength < -110:
        base_loss = random.uniform(5, 25)
    elif signal_strength < -95:
        base_loss = random.uniform(1, 8)
    elif elevation < 10:
        base_loss = random.uniform(0.5, 5)
    else:
        base_loss = random.uniform(0, 1.5)

    burst = 0
    if random.random() < 0.02:
        burst = random.uniform(10, 40)

    return min(100, base_loss + burst)


def generate_bandwidth(signal_strength, congestion_factor=0):
    max_bw = 100
    signal_factor = max(0, (signal_strength + 120) / 60)
    congestion = max(0, 1 - congestion_factor)
    noise = random.gauss(1, 0.05)
    return max(0.1, max_bw * signal_factor * congestion * noise)


def generate_doppler_shift(velocity_km_s, frequency_ghz=12.0):
    c = 299792.458
    radial_component = velocity_km_s * random.uniform(-0.3, 0.3)
    shift = (radial_component / c) * frequency_ghz * 1e9
    return round(shift, 2)


def generate_error_rate(snr):
    if snr > 20:
        return random.uniform(0, 0.01)
    elif snr > 10:
        return random.uniform(0.01, 0.5)
    else:
        return random.uniform(0.5, 5.0)


def generate_telemetry(sat_position, station, congestion_factor=0):
    elevation = station.get("elevation", 30)
    altitude = sat_position.get("altitude_km", 500)
    speed = sat_position.get("speed_km_s", 7.5)

    signal = generate_signal_strength(elevation)
    snr = generate_snr(signal)
    latency = generate_latency(altitude, elevation)
    jitter = generate_jitter(latency)
    packet_loss = generate_packet_loss(elevation, signal)
    bandwidth = generate_bandwidth(signal, congestion_factor)
    doppler = generate_doppler_shift(speed)
    error_rate = generate_error_rate(snr)

    return {
        "signal_strength": round(signal, 2),
        "snr": round(snr, 2),
        "latency": round(latency, 2),
        "jitter": round(jitter, 2),
        "packet_loss": round(packet_loss, 3),
        "bandwidth": round(bandwidth, 2),
        "doppler_shift": doppler,
        "error_rate": round(error_rate, 4),
        "metadata": {
            "elevation": round(elevation, 2),
            "altitude_km": round(altitude, 2),
            "latitude": round(sat_position.get("latitude", 0), 4),
            "longitude": round(sat_position.get("longitude", 0), 4),
        },
    }
