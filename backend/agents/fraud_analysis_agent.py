"""Fraud analysis agent enriches alerts with LLM explanations."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict

from openai import OpenAI

from .base import BaseAgent, mask_sensitive

LOGGER = logging.getLogger(__name__)


class FraudAnalysisAgent(BaseAgent):
    consumer_topics = ("fraud_alerts",)
    producer_topic = "fraud_explanations"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY must be configured")
        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-5-nano")

    def handle_message(self, message: Dict[str, Any]) -> None:
        prompt = (
            "Explain why this alert might indicate fraud: "
            f"{mask_sensitive(message)}"
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            explanation = response.choices[0].message["content"].strip()
        except Exception as exc:  # pragma: no cover - depends on API availability
            LOGGER.exception("Failed to generate fraud explanation: %s", exc)
            explanation = "Unable to generate explanation at this time."

        payload = {
            "customer_id": message.get("customer_id"),
            "risk_score": message.get("risk_score"),
            "severity": message.get("severity"),
            "explanation": explanation,
            "metrics": message.get("metrics", {}),
        }
        LOGGER.info("Publishing fraud explanation: %s", mask_sensitive(payload))
        self.producer.send(self.producer_topic, payload)