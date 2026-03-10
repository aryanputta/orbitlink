GROUND_STATIONS = [
    {"name": "Svalbard SvalSat", "lat": 78.2306, "lon": 15.3894, "elev_m": 450, "capacity": 6, "region": "Arctic"},
    {"name": "Fairbanks NOAA", "lat": 64.8594, "lon": -147.8386, "elev_m": 160, "capacity": 4, "region": "North America"},
    {"name": "Wallops Island", "lat": 37.9402, "lon": -75.4664, "elev_m": 5, "capacity": 5, "region": "North America"},
    {"name": "Canberra DSN", "lat": -35.4014, "lon": 148.9817, "elev_m": 680, "capacity": 4, "region": "Oceania"},
    {"name": "Kourou CSG", "lat": 5.2361, "lon": -52.7686, "elev_m": 15, "capacity": 4, "region": "South America"},
    {"name": "Maspalomas", "lat": 27.7633, "lon": -15.6342, "elev_m": 205, "capacity": 3, "region": "Europe"},
    {"name": "Tromsø", "lat": 69.6628, "lon": 18.9406, "elev_m": 130, "capacity": 4, "region": "Europe"},
    {"name": "McMurdo", "lat": -77.8419, "lon": 166.6686, "elev_m": 10, "capacity": 3, "region": "Antarctica"},
]


def find_visible_stations(sat_lat, sat_lon, sat_alt, stations=None, min_elevation=5.0):
    from .orbital import compute_elevation

    if stations is None:
        stations = GROUND_STATIONS

    visible = []
    for gs in stations:
        elev = compute_elevation(sat_lat, sat_lon, sat_alt, gs["lat"], gs["lon"], gs["elev_m"])
        if elev >= min_elevation:
            visible.append({**gs, "elevation": elev})

    visible.sort(key=lambda s: s["elevation"], reverse=True)
    return visible


def select_best_station(visible_stations, congestion=None):
    if not visible_stations:
        return None

    if congestion is None:
        congestion = {}

    best = None
    best_score = -1

    for station in visible_stations:
        elev_score = station["elevation"] / 90.0
        congestion_penalty = congestion.get(station["name"], 0) / station["capacity"]
        score = elev_score * 0.7 - congestion_penalty * 0.3

        if score > best_score:
            best_score = score
            best = station

    return best
