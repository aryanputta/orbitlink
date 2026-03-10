import math
import numpy as np
from sgp4.api import Satrec, WGS72
from sgp4.api import jday
from datetime import datetime, timezone


def propagate(tle_line1, tle_line2, dt=None):
    if dt is None:
        dt = datetime.now(timezone.utc)

    satellite = Satrec.twoline2rv(tle_line1, tle_line2, WGS72)
    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second + dt.microsecond / 1e6)

    error, position, velocity = satellite.sgp4(jd, fr)
    if error != 0:
        return None

    x, y, z = position
    vx, vy, vz = velocity

    lat, lon, alt = eci_to_geodetic(x, y, z, jd + fr)

    return {
        "position_eci": {"x": x, "y": y, "z": z},
        "velocity_eci": {"vx": vx, "vy": vy, "vz": vz},
        "latitude": lat,
        "longitude": lon,
        "altitude_km": alt,
        "speed_km_s": math.sqrt(vx**2 + vy**2 + vz**2),
        "timestamp": dt.isoformat(),
    }


def eci_to_geodetic(x, y, z, jd_ut1):
    theta_gmst = gstime(jd_ut1)

    r = math.sqrt(x**2 + y**2 + z**2)
    lon = math.atan2(y, x) - theta_gmst
    lat = math.asin(z / r)

    lon = ((lon + math.pi) % (2 * math.pi)) - math.pi

    a = 6378.137
    alt = r - a

    return math.degrees(lat), math.degrees(lon), alt


def gstime(jd_ut1):
    t_ut1 = (jd_ut1 - 2451545.0) / 36525.0
    theta = (
        67310.54841
        + (876600.0 * 3600 + 8640184.812866) * t_ut1
        + 0.093104 * t_ut1**2
        - 6.2e-6 * t_ut1**3
    )
    theta = math.radians(theta % 360.0 * (360.0 / 86400.0))
    if theta < 0:
        theta += 2 * math.pi
    return theta


def compute_elevation(sat_lat, sat_lon, sat_alt, gs_lat, gs_lon, gs_elev_m=0):
    sat_lat_r = math.radians(sat_lat)
    sat_lon_r = math.radians(sat_lon)
    gs_lat_r = math.radians(gs_lat)
    gs_lon_r = math.radians(gs_lon)

    dlon = sat_lon_r - gs_lon_r

    central_angle = math.acos(
        math.sin(gs_lat_r) * math.sin(sat_lat_r)
        + math.cos(gs_lat_r) * math.cos(sat_lat_r) * math.cos(dlon)
    )

    R = 6371.0
    sat_r = R + sat_alt
    gs_r = R + gs_elev_m / 1000.0

    elevation = math.atan2(
        sat_r * math.cos(central_angle) - gs_r,
        sat_r * math.sin(central_angle),
    )

    return math.degrees(elevation)


def is_visible(elevation_deg, min_elevation=5.0):
    return elevation_deg >= min_elevation
