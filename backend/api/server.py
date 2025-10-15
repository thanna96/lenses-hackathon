"""FastAPI server exposing REST and WebSocket interfaces."""
from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
from concurrent.futures import Future
from typing import Callable, Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from confluent_kafka import Consumer as KafkaConsumer
from confluent_kafka import KafkaError
from uvicorn import Config, Server

from ..agents.notification_agent import NotificationAgent
from ..config.kafka import KafkaSettings, get_kafka_settings
from .routes.summary import router as summary_router
from .state import RiskState
from .websocket import ConnectionManager

LOGGER = logging.getLogger(__name__)

risk_state = RiskState()
ws_manager = ConnectionManager()
_stop_event = threading.Event()
_background_threads: List[threading.Thread] = []
_notification_agent: NotificationAgent | None = None


def create_app() -> FastAPI:
    app = FastAPI(title="Unified Risk Intelligence Platform", version="1.0.0")

    client_origin = os.getenv("CLIENT_ORIGIN", "*")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[client_origin] if client_origin != "*" else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(summary_router)

    @app.websocket("/ws/updates")
    async def websocket_endpoint(websocket: WebSocket) -> None:
        await ws_manager.connect(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await ws_manager.disconnect(websocket)
        except Exception as exc:  # pragma: no cover - network runtime
            LOGGER.warning("WebSocket error: %s", exc)
            await ws_manager.disconnect(websocket)

    @app.on_event("startup")
    async def startup_event() -> None:
        LOGGER.info("Starting API service")
        start_background_streams()

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        LOGGER.info("Shutting down API service")
        stop_background_streams()

    return app


def start_background_streams() -> None:
    loop = asyncio.get_running_loop()
    settings = get_kafka_settings()
    _stop_event.clear()
    _background_threads.clear()

    def handle_explanation(payload: Dict[str, object]) -> None:
        async def _process(data: Dict[str, object]) -> None:
            await risk_state.record_explanation(data)
            await risk_state.record_risk(data)
            await ws_manager.broadcast({"type": "fraud_explanation", "data": data})

        future = asyncio.run_coroutine_threadsafe(_process(payload), loop)
        future.add_done_callback(_log_future)

    def start_agent() -> None:
        global _notification_agent
        _notification_agent = NotificationAgent(
            settings.bootstrap_servers,
            consumer_group="notification-agent",
            notifier=handle_explanation,
        )
        _notification_agent.run()

    thread = threading.Thread(target=start_agent, name="notification-agent", daemon=True)
    thread.start()
    _background_threads.append(thread)

    start_consumer_thread(
        topic="risk_scores",
        group="api-risk-cache",
        handler=lambda payload: asyncio.run_coroutine_threadsafe(
            risk_state.record_risk(payload), loop
        ),
        settings=settings,
    )

    start_consumer_thread(
        topic="fraud_alerts",
        group="api-alert-cache",
        handler=lambda payload: asyncio.run_coroutine_threadsafe(
            risk_state.record_alert(payload), loop
        ),
        settings=settings,
    )


def _log_future(future: asyncio.Future) -> None:
    try:
        future.result()
    except Exception as exc:  # pragma: no cover - diagnostic helper
        LOGGER.exception("Background task failed: %s", exc)

def start_consumer_thread(
    *,
    topic: str,
    group: str,
    handler: Callable[[Dict[str, object]], object],
    settings: KafkaSettings,
) -> None:
    def run() -> None:
        LOGGER.info("Starting Kafka watcher for topic %s", topic)
        consumer = KafkaConsumer(
            {
                "bootstrap.servers": settings.bootstrap_servers,
                "group.id": group,
                "auto.offset.reset": settings.auto_offset_reset,
                "enable.auto.commit": True,
            }
        )
        consumer.subscribe([topic])
        try:
            while not _stop_event.is_set():
                message = consumer.poll(1.0)
                if message is None:
                    continue
                if message.error():
                    if message.error().code() != KafkaError._PARTITION_EOF:
                        LOGGER.warning(
                            "Kafka error on topic %s: %s", topic, message.error()
                        )
                    continue
                raw_value = message.value()
                if raw_value is None:
                    LOGGER.debug("Received empty payload from topic %s", topic)
                    continue
                try:
                    payload = json.loads(raw_value.decode("utf-8"))
                except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                    LOGGER.warning("Invalid payload from topic %s: %s", topic, exc)
                    continue
                future = handler(payload)
                if isinstance(future, (asyncio.Future, Future)):
                    future.add_done_callback(_log_future)
        finally:
            consumer.close()
            LOGGER.info("Stopped Kafka watcher for topic %s", topic)

    thread = threading.Thread(target=run, name=f"watcher-{topic}", daemon=True)
    thread.start()
    _background_threads.append(thread)


def stop_background_streams() -> None:
    _stop_event.set()
    if _notification_agent is not None:
        _notification_agent.stop()
    for thread in list(_background_threads):
        thread.join(timeout=5)
        if thread.is_alive():
            LOGGER.warning("Thread %s did not shut down cleanly", thread.name)
        _background_threads.remove(thread)


def run_api_server() -> None:
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    app = create_app()
    host = "0.0.0.0"
    port = int(os.getenv("PORT", "4000"))
    server = Server(Config(app=app, host=host, port=port, reload=False))
    asyncio.run(server.serve())