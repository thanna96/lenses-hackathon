"""Risk scoring agent consumes transactional data and emits risk scores."""
from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, DefaultDict

from .base import BaseAgent, mask_sensitive

LOGGER = logging.getLogger(__name__)


@dataclass
class CustomerMetrics:
    late_payment_rate: float = 0.0
    transaction_frequency: float = 0.0
    merchant_risk: float = 0.0


class RiskScoringAgent(BaseAgent):
    consumer_topics = ("loan_payments", "transactions")
    producer_topic = "risk_scores"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.metrics: DefaultDict[str, CustomerMetrics] = defaultdict(CustomerMetrics)

    def handle_message(self, message: Dict[str, Any]) -> None:
        customer_id = message.get("customer_id")
        if not customer_id:
            LOGGER.warning("Skipping message without customer_id: %s", message)
            return

        if message.get("type") == "loan_payment":
            self._update_payment_metrics(customer_id, message)
        elif message.get("type") == "transaction":
            self._update_transaction_metrics(customer_id, message)
        else:
            LOGGER.debug("Unknown message type %s", message.get("type"))

        metrics = self.metrics[customer_id]
        risk = round(
            0.4 * metrics.late_payment_rate
            + 0.3 * metrics.transaction_frequency
            + 0.3 * metrics.merchant_risk,
            4,
        )

        payload = {
            "customer_id": customer_id,
            "risk_score": risk,
            "metrics": {
                "late_payment_rate": metrics.late_payment_rate,
                "transaction_frequency": metrics.transaction_frequency,
                "merchant_risk": metrics.merchant_risk,
            },
        }
        LOGGER.info("Publishing risk score: %s", mask_sensitive(payload))
        self.producer.send(self.producer_topic, payload)

    def _update_payment_metrics(self, customer_id: str, message: Dict[str, Any]) -> None:
        status = message.get("status")
        days_late = float(message.get("days_late", 0))
        metrics = self.metrics[customer_id]
        if status == "late":
            metrics.late_payment_rate = min(1.0, metrics.late_payment_rate + days_late / 30)
        else:
            metrics.late_payment_rate = max(0.0, metrics.late_payment_rate * 0.9)

    def _update_transaction_metrics(self, customer_id: str, message: Dict[str, Any]) -> None:
        amount = float(message.get("amount", 0))
        category_risk = float(message.get("merchant_risk", 0))
        metrics = self.metrics[customer_id]
        metrics.transaction_frequency = min(1.0, metrics.transaction_frequency * 0.8 + 0.2)
        metrics.merchant_risk = min(1.0, max(metrics.merchant_risk, category_risk) * 0.7 + 0.3 * (amount / 1000))
        metrics.merchant_risk = min(metrics.merchant_risk, 1.0)