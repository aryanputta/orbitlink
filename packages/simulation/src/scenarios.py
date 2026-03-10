import random
import math


class Scenario:
    def __init__(self, name, duration_s, probability):
        self.name = name
        self.duration_s = duration_s
        self.probability = probability
        self.active = False
        self.remaining_s = 0

    def try_activate(self):
        if not self.active and random.random() < self.probability:
            self.active = True
            self.remaining_s = self.duration_s
            return True
        return False

    def tick(self):
        if self.active:
            self.remaining_s -= 1
            if self.remaining_s <= 0:
                self.active = False

    def apply(self, telemetry):
        return telemetry


class SolarInterference(Scenario):
    def __init__(self):
        super().__init__("solar_interference", duration_s=60, probability=0.001)

    def apply(self, telemetry):
        if not self.active:
            return telemetry
        telemetry["signal_strength"] -= random.uniform(15, 30)
        telemetry["snr"] *= 0.4
        telemetry["packet_loss"] += random.uniform(10, 30)
        telemetry["error_rate"] += random.uniform(1, 5)
        return telemetry


class StationOutage(Scenario):
    def __init__(self):
        super().__init__("station_outage", duration_s=120, probability=0.0005)
        self.affected_station = None

    def try_activate(self):
        activated = super().try_activate()
        if activated:
            self.affected_station = random.randint(0, 7)
        return activated

    def is_station_down(self, station_index):
        return self.active and station_index == self.affected_station


class CongestionSpike(Scenario):
    def __init__(self):
        super().__init__("congestion_spike", duration_s=45, probability=0.003)

    def apply(self, telemetry):
        if not self.active:
            return telemetry
        telemetry["bandwidth"] *= random.uniform(0.2, 0.5)
        telemetry["latency"] += random.uniform(50, 150)
        telemetry["jitter"] += random.uniform(20, 60)
        return telemetry


class WeatherAttenuation(Scenario):
    def __init__(self):
        super().__init__("weather_attenuation", duration_s=90, probability=0.002)
        self.attenuation_db = 0

    def try_activate(self):
        activated = super().try_activate()
        if activated:
            self.attenuation_db = random.uniform(8, 25)
        return activated

    def apply(self, telemetry):
        if not self.active:
            return telemetry
        telemetry["signal_strength"] -= self.attenuation_db
        telemetry["snr"] -= self.attenuation_db * 0.6
        telemetry["packet_loss"] += self.attenuation_db * 0.5
        return telemetry


class HandoffFailure(Scenario):
    def __init__(self):
        super().__init__("handoff_failure", duration_s=15, probability=0.002)

    def apply(self, telemetry):
        if not self.active:
            return telemetry
        telemetry["packet_loss"] = min(100, telemetry["packet_loss"] + random.uniform(30, 70))
        telemetry["latency"] += random.uniform(200, 500)
        telemetry["bandwidth"] *= 0.1
        return telemetry


class PacketCorruption(Scenario):
    def __init__(self):
        super().__init__("packet_corruption", duration_s=20, probability=0.003)

    def apply(self, telemetry):
        if not self.active:
            return telemetry
        telemetry["error_rate"] += random.uniform(3, 15)
        telemetry["packet_loss"] += random.uniform(5, 15)
        return telemetry


def create_all_scenarios():
    return [
        SolarInterference(),
        StationOutage(),
        CongestionSpike(),
        WeatherAttenuation(),
        HandoffFailure(),
        PacketCorruption(),
    ]
