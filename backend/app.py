"""Entry point for running Unified Risk Intelligence services."""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

from .agents.anomaly_agent import AnomalyAgent
from .agents.fraud_analysis_agent import FraudAnalysisAgent
from .agents.risk_scoring_agent import RiskScoringAgent
from .config.kafka import get_kafka_settings
from .api.server import run_api_server

load_dotenv()

LOGGER = logging.getLogger(__name__)


def configure_logging() -> None:
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s - %(message)s")


def build_agent(role: str):
    settings = get_kafka_settings()
    group_prefix = os.getenv("CONSUMER_GROUP_PREFIX", "unified-risk")
    if role == "risk-agent":
        return RiskScoringAgent(settings.bootstrap_servers, consumer_group=f"{group_prefix}-risk")
    if role == "anomaly-agent":
        return AnomalyAgent(settings.bootstrap_servers, consumer_group=f"{group_prefix}-anomaly")
    if role == "fraud-agent":
        return FraudAnalysisAgent(settings.bootstrap_servers, consumer_group=f"{group_prefix}-fraud")
    raise ValueError(f"Unknown agent role: {role}")


def main() -> None:
    configure_logging()
    role = os.getenv("SERVICE_ROLE", "api")
    LOGGER.info("Launching service role: %s", role)
    if role == "api":
        run_api_server()
    else:
        agent = build_agent(role)
        agent.run()


if __name__ == "__main__":
    main()