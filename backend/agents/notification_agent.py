"""Notification agent streams fraud explanations to clients and downstream channels."""
from __future__ import annotations

import logging
from typing import Any, Callable, Dict, Optional

from .base import BaseAgent, mask_sensitive

LOGGER = logging.getLogger(__name__)


class NotificationAgent(BaseAgent):
    consumer_topics = ("fraud_explanations",)
    producer_topic = None

    def __init__(
        self,
        *args: Any,
        notifier: Optional[Callable[[Dict[str, Any]], None]] = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self._notifier = notifier

    def handle_message(self, message: Dict[str, Any]) -> None:
        LOGGER.info("Dispatching notification: %s", mask_sensitive(message))
        if self._notifier:
            try:
                self._notifier(message)
            except Exception as exc:  # pragma: no cover - depends on notifier implementation
                LOGGER.exception("Failed to dispatch notification: %s", exc)
        # Placeholder for additional notification channels (email, SMS, etc.)