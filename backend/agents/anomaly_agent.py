"""Anomaly agent converts risk scores into actionable fraud alerts."""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import BaseAgent, mask_sensitive

LOGGER = logging.getLogger(__name__)


class AnomalyAgent(BaseAgent):
    consumer_topics = ("risk_scores",)
    producer_topic = "fraud_alerts"

    def handle_message(self, message: Dict[str, Any]) -> None:
        risk_score = float(message.get("risk_score", 0))
        if risk_score < 0.6:
            LOGGER.debug("Risk score %.2f below threshold, skipping", risk_score)
            return

        alert = {
            "customer_id": message.get("customer_id"),
            "risk_score": risk_score,
            "metrics": message.get("metrics", {}),
            "severity": self._calculate_severity(risk_score),
        }
        LOGGER.info("Publishing fraud alert: %s", mask_sensitive(alert))
        self.producer.send(self.producer_topic, alert)

    @staticmethod
    def _calculate_severity(risk_score: float) -> str:
        if risk_score >= 0.9:
            return "critical"
        if risk_score >= 0.75:
            return "high"
        return "medium"