"""WebSocket manager broadcasting live risk intelligence updates."""
from __future__ import annotations

import asyncio
import logging
from typing import Dict, List

from fastapi import WebSocket

LOGGER = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.append(websocket)
        LOGGER.info("WebSocket client connected. Active: %s", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self._connections:
                self._connections.remove(websocket)
        LOGGER.info("WebSocket client disconnected. Active: %s", len(self._connections))

    async def broadcast(self, message: Dict[str, object]) -> None:
        async with self._lock:
            targets = list(self._connections)
        if not targets:
            return
        LOGGER.debug("Broadcasting message to %s clients", len(targets))
        living: List[WebSocket] = []
        for connection in targets:
            try:
                await connection.send_json(message)
                living.append(connection)
            except Exception as exc:  # pragma: no cover - depends on network stack
                LOGGER.warning("WebSocket send failed: %s", exc)
        async with self._lock:
            self._connections = living