"""Common abstractions shared by Unified Risk Intelligence agents."""
from __future__ import annotations

import json
import logging
import signal
import threading
from abc import ABC, abstractmethod
from typing import Any, Dict, Iterable, Optional

from confluent_kafka import KafkaError
from confluent_kafka import Consumer as KafkaConsumer
from confluent_kafka import Producer as KafkaProducer

LOGGER = logging.getLogger(__name__)


def mask_sensitive(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask potentially sensitive fields before logging."""
    masked: Dict[str, Any] = {}
    for key, value in data.items():
        if any(token in key.lower() for token in {"card", "pan", "ssn"}):
            masked[key] = "***MASKED***"
        else:
            masked[key] = value
    return masked


class GracefulShutdown:
    """Utility that triggers a shutdown event on SIGINT or SIGTERM."""


    def __init__(self, *, register_signals: bool = True) -> None:
        self._shutdown = threading.Event()
        self._signals_registered = (
            register_signals and threading.current_thread() is threading.main_thread()
        )
        if self._signals_registered:
            signal.signal(signal.SIGINT, self._handler)  # type: ignore[arg-type]
            signal.signal(signal.SIGTERM, self._handler)  # type: ignore[arg-type]

    def _handler(self, signum: int, _: Optional[Any]) -> None:
        LOGGER.info("Received signal %s, shutting down agent", signum)
        self._shutdown.set()

    def trigger(self) -> None:
        """Signal that the agent should exit."""
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
        self._consumer: Optional[KafkaConsumer] = None
        self._producer: Optional[KafkaProducer] = None
        should_register_signals = threading.current_thread() is threading.main_thread()
        self._shutdown = GracefulShutdown(register_signals=should_register_signals)

    @property
    def consumer(self) -> KafkaConsumer:
        if self._consumer is None:
            topics = tuple(self.consumer_topics)
            if not topics:
                raise RuntimeError("consumer_topics is empty for this agent")
                conf = {
                        "bootstrap.servers": self.kafka_bootstrap_servers,
                        "group.id": self.consumer_group,
                        "auto.offset.reset": self.auto_offset_reset,
                        "enable.auto.commit": True,
                    }
                self._consumer = KafkaConsumer(conf)
                self._consumer.subscribe(list(topics))
                return self._consumer

    @property
    def producer(self) -> KafkaProducer:
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
            self._producer = KafkaProducer(conf)
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

    def stop(self) -> None:
        """Trigger a graceful shutdown."""
        self._shutdown.trigger()
        if self._consumer is not None:
            try:
                self._consumer.wakeup()
            except Exception:  # pragma: no cover - defensive cleanup
                pass


    def _process_stream(self) -> None:
        consumer = self.consumer
        while not self._shutdown.should_exit:
            message = consumer.poll(1.0)
            if message is None:
                continue
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    LOGGER.warning("Kafka error: %s", message.error())
                continue
            raw_value = message.value()
            if raw_value is None:
                LOGGER.debug("Received Kafka message with empty payload")
                continue
            try:
                payload = json.loads(raw_value.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                LOGGER.warning("Discarding malformed message: %s", exc)
                continue
            try:
                self.handle_message(payload)
            except Exception as exc:  # pragma: no cover - defensive logging
                LOGGER.exception("Error handling message: %s", exc)

    @abstractmethod
    def handle_message(self, message: Dict[str, Any]) -> None:
        """Implement the business logic for each consumed message."""
        raise NotImplementedError