import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np
import pandas as pd

from .predict import load_models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("orbitlink-ml")

app = FastAPI(title="OrbitLink ML Service", version="1.0.0")

predictor = None
anomaly_detector = None


class TelemetryInput(BaseModel):
    signal_strength: float
    snr: float
    latency: float
    jitter: float
    packet_loss: float
    bandwidth: float
    error_rate: float = 0.0
    rolling_latency_avg: Optional[float] = None
    signal_trend: Optional[float] = None
    packet_loss_trend: Optional[float] = None


class PredictionResult(BaseModel):
    failure_probability: float
    risk_level: str
    anomaly_score: float
    is_anomaly: bool


@app.on_event("startup")
async def startup():
    global predictor, anomaly_detector
    log.info("Loading ML models...")
    predictor, anomaly_detector = load_models()
    log.info("Models loaded successfully")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "predictor_loaded": predictor is not None,
        "anomaly_detector_loaded": anomaly_detector is not None,
    }


@app.post("/predict", response_model=PredictionResult)
async def predict(reading: TelemetryInput):
    if predictor is None or anomaly_detector is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    features = pd.DataFrame([{
        "signal_strength": reading.signal_strength,
        "snr": reading.snr,
        "latency": reading.latency,
        "jitter": reading.jitter,
        "packet_loss": reading.packet_loss,
        "bandwidth": reading.bandwidth,
        "error_rate": reading.error_rate,
        "rolling_latency_avg": reading.rolling_latency_avg or reading.latency,
        "signal_trend": reading.signal_trend or 0.0,
        "packet_loss_trend": reading.packet_loss_trend or 0.0,
    }])

    failure_prob = float(predictor.predict_proba(features)[0][1])
    anomaly_raw = float(anomaly_detector.decision_function(features)[0])
    is_anomaly = bool(anomaly_detector.predict(features)[0] == -1)

    if failure_prob >= 0.75:
        risk = "critical"
    elif failure_prob >= 0.5:
        risk = "high"
    elif failure_prob >= 0.25:
        risk = "moderate"
    else:
        risk = "low"

    return PredictionResult(
        failure_probability=round(failure_prob, 4),
        risk_level=risk,
        anomaly_score=round(anomaly_raw, 4),
        is_anomaly=is_anomaly,
    )


@app.post("/predict/batch")
async def predict_batch(readings: list[TelemetryInput]):
    if predictor is None or anomaly_detector is None:
        raise HTTPException(status_code=503, detail="Models not loaded")

    rows = [{
        "signal_strength": r.signal_strength,
        "snr": r.snr,
        "latency": r.latency,
        "jitter": r.jitter,
        "packet_loss": r.packet_loss,
        "bandwidth": r.bandwidth,
        "error_rate": r.error_rate,
        "rolling_latency_avg": r.rolling_latency_avg or r.latency,
        "signal_trend": r.signal_trend or 0.0,
        "packet_loss_trend": r.packet_loss_trend or 0.0,
    } for r in readings]

    features = pd.DataFrame(rows)
    probs = predictor.predict_proba(features)[:, 1]
    anomaly_scores = anomaly_detector.decision_function(features)
    anomaly_labels = anomaly_detector.predict(features)

    results = []
    for i in range(len(readings)):
        prob = float(probs[i])
        if prob >= 0.75:
            risk = "critical"
        elif prob >= 0.5:
            risk = "high"
        elif prob >= 0.25:
            risk = "moderate"
        else:
            risk = "low"

        results.append({
            "failure_probability": round(prob, 4),
            "risk_level": risk,
            "anomaly_score": round(float(anomaly_scores[i]), 4),
            "is_anomaly": bool(anomaly_labels[i] == -1),
        })

    return results
