"""Common abstractions shared by Unified Risk Intelligence agents."""
from __future__ import annotations

import json
import logging
import signal
import threading
from abc import ABC, abstractmethod
from typing import Any, Dict, Iterable, Optional

from confluent_kafka import Consumer, Producer


LOGGER = logging.getLogger(__name__)


def mask_sensitive(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask potentially sensitive fields before logging."""
    masked = {}
    for key, value in data.items():
        if any(token in key.lower() for token in {"card", "pan", "ssn"}):
            masked[key] = "***MASKED***"
        else:
            masked[key] = value
    return masked


class GracefulShutdown:
    """Utility that triggers a shutdown event on SIGINT or SIGTERM."""

    def __init__(self) -> None:
        self._shutdown = threading.Event()
        signal.signal(signal.SIGINT, self._handler)  # type: ignore[arg-type]
        signal.signal(signal.SIGTERM, self._handler)  # type: ignore[arg-type]

    def _handler(self, signum: int, _: Optional[Any]) -> None:
        LOGGER.info("Received signal %s, shutting down agent", signum)
        self._shutdown.set()

    def wait(self, timeout: Optional[float] = None) -> bool:
        return self._shutdown.wait(timeout)

    @property
    def should_exit(self) -> bool:
        return self._shutdown.is_set()


class BaseAgent(ABC):
    """Base class for all agents that consume and produce Kafka messages."""

    consumer_topics: Iterable[str]
    producer_topic: Optional[str] = None

    def __init__(
        self,
        kafka_bootstrap_servers: str,
        consumer_group: str,
        *,
        auto_offset_reset: str = "latest",
    ) -> None:
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer_group = consumer_group
        self.auto_offset_reset = auto_offset_reset
        self._consumer: Optional[Consumer] = None
        self._producer: Optional[Producer] = None
        self._shutdown = GracefulShutdown()
 @property
    def consumer(self) -> CConsumer:
        """
        confluent-kafka Consumer:
        - create with a config dict
        - then .subscribe(topics)
        - do JSON decoding after poll()
        """
        if self._consumer is None:
            conf = {
                "bootstrap.servers": self.kafka_bootstrap_servers,
                "group.id": self.consumer_group,
                "auto.offset.reset": self.auto_offset_reset,  # "earliest"/"latest"
                "enable.auto.commit": True,
            }
            self._consumer = CConsumer(conf)
            # Subscribe to topics after constructing the consumer
            if not getattr(self, "consumer_topics", None):
                raise RuntimeError("consumer_topics is empty for this agent")
            self._consumer.subscribe(self.consumer_topics)
        return self._consumer

    @property
    def producer(self) -> CProducer:
        """
        confluent-kafka Producer:
        - create with config dict
        - call .produce(topic, value=bytes/str, key=optional)
        - JSON encoding done by helper below
        """
        if self.producer_topic is None:
            raise RuntimeError("Producer topic is not configured for this agent")
        if self._producer is None:
            conf = {
                "bootstrap.servers": self.kafka_bootstrap_servers,
            }
            self._producer = CProducer(conf)
        return self._producer

    def run(self) -> None:
        LOGGER.info("Starting %s", self.__class__.__name__)
        try:
            self._process_stream()
        finally:
            self._cleanup()

    def _cleanup(self) -> None:
        LOGGER.info("Cleaning up %s", self.__class__.__name__)
        if self._consumer is not None:
            self._consumer.close()
        if self._producer is not None:
            self._producer.flush()
            self._producer.close()

    def stop(self) -> None:
        """Trigger a graceful shutdown."""
        self._shutdown._shutdown.set()
        if self._consumer is not None:
            try:
                self._consumer.wakeup()
            except Exception:  # pragma: no cover - defensive cleanup
                pass

    def _process_stream(self) -> None:
        while not self._shutdown.should_exit:
            for message in self.consumer:
                payload = message.value
                try:
                    self.handle_message(payload)
                except Exception as exc:  # pragma: no cover - defensive logging
                    LOGGER.exception("Error handling message: %s", exc)
                if self._shutdown.should_exit:
                    break
            if self._shutdown.should_exit:
                break

    @abstractmethod
    def handle_message(self, message: Dict[str, Any]) -> None:
        """Implement the business logic for each consumed message."""
        raise NotImplementedError