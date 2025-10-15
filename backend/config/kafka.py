"""Kafka configuration helpers."""
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass
class KafkaSettings:
    bootstrap_servers: str
    auto_offset_reset: str = "latest"


def get_kafka_settings() -> KafkaSettings:
    brokers = os.getenv("KAFKA_BROKERS")
    if not brokers:
        raise RuntimeError("KAFKA_BROKERS environment variable is required")
    offset = os.getenv("KAFKA_AUTO_OFFSET_RESET", "latest")
    return KafkaSettings(bootstrap_servers=brokers, auto_offset_reset=offset)
