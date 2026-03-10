import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest
import joblib
import os
import logging

log = logging.getLogger("orbitlink-ml")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
PREDICTOR_PATH = os.path.join(MODEL_DIR, "link_failure_predictor.pkl")
ANOMALY_PATH = os.path.join(MODEL_DIR, "anomaly_detector.pkl")


def generate_training_data(n_samples=10000):
    np.random.seed(42)

    signal = np.random.uniform(-120, -60, n_samples)
    snr = signal + 120 + np.random.normal(0, 3, n_samples)
    latency = np.random.exponential(100, n_samples) + 20
    jitter = np.abs(np.random.normal(0, latency * 0.15))
    packet_loss = np.random.exponential(3, n_samples)
    bandwidth = np.clip(100 * (signal + 120) / 60 + np.random.normal(0, 5, n_samples), 0.1, 100)
    error_rate = np.clip(np.random.exponential(0.5, n_samples), 0, 20)

    rolling_latency_avg = latency + np.random.normal(0, 10, n_samples)
    signal_trend = np.random.uniform(-5, 5, n_samples)
    packet_loss_trend = np.random.uniform(-2, 2, n_samples)

    features = pd.DataFrame({
        "signal_strength": signal,
        "snr": snr,
        "latency": latency,
        "jitter": jitter,
        "packet_loss": packet_loss,
        "bandwidth": bandwidth,
        "error_rate": error_rate,
        "rolling_latency_avg": rolling_latency_avg,
        "signal_trend": signal_trend,
        "packet_loss_trend": packet_loss_trend,
    })

    failure_prob = (
        0.3 * np.clip((packet_loss - 10) / 30, 0, 1)
        + 0.25 * np.clip((latency - 200) / 300, 0, 1)
        + 0.25 * np.clip((-signal - 100) / 20, 0, 1)
        + 0.1 * np.clip(packet_loss_trend / 5, 0, 1)
        + 0.1 * np.clip(-signal_trend / 5, 0, 1)
    )

    labels = (failure_prob + np.random.normal(0, 0.1, n_samples) > 0.5).astype(int)

    return features, labels


def train_predictor():
    os.makedirs(MODEL_DIR, exist_ok=True)
    log.info("Generating training data...")
    X, y = generate_training_data(20000)

    model = XGBClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss",
    )
    model.fit(X, y)
    joblib.dump(model, PREDICTOR_PATH)
    log.info(f"Predictor saved to {PREDICTOR_PATH}")
    return model


def train_anomaly_detector():
    os.makedirs(MODEL_DIR, exist_ok=True)
    log.info("Training anomaly detector...")
    X, _ = generate_training_data(5000)

    normal_mask = X["packet_loss"] < 15
    X_normal = X[normal_mask]

    detector = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    detector.fit(X_normal)
    joblib.dump(detector, ANOMALY_PATH)
    log.info(f"Anomaly detector saved to {ANOMALY_PATH}")
    return detector


def load_models():
    predictor, detector = None, None

    if os.path.exists(PREDICTOR_PATH):
        predictor = joblib.load(PREDICTOR_PATH)
    else:
        predictor = train_predictor()

    if os.path.exists(ANOMALY_PATH):
        detector = joblib.load(ANOMALY_PATH)
    else:
        detector = train_anomaly_detector()

    return predictor, detector
