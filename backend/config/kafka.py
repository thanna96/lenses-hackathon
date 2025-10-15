"""Kafka configuration helpers."""
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass
class KafkaSettings:
    bootstrap_servers: str


def get_kafka_settings() -> KafkaSettings:
    brokers = os.getenv("KAFKA_BROKERS")
    if not brokers:
        raise RuntimeError("KAFKA_BROKERS environment variable is required")
    return KafkaSettings(bootstrap_servers=brokers)