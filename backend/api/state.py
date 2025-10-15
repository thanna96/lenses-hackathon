"""In-memory state store for API responses."""
from __future__ import annotations

import asyncio
from collections import deque
from statistics import mean
from typing import Deque, Dict, List


class RiskState:
    def __init__(self, *, maxlen: int = 500) -> None:
        self._lock = asyncio.Lock()
        self._risk_scores: Deque[Dict[str, float]] = deque(maxlen=maxlen)
        self._alerts: Deque[Dict[str, object]] = deque(maxlen=maxlen)
        self._explanations: Deque[Dict[str, object]] = deque(maxlen=maxlen)

    async def record_risk(self, payload: Dict[str, object]) -> None:
        async with self._lock:
            self._risk_scores.append({
                "customer_id": payload.get("customer_id", "unknown"),
                "risk_score": float(payload.get("risk_score", 0.0)),
            })

    async def record_alert(self, payload: Dict[str, object]) -> None:
        async with self._lock:
            self._alerts.append(payload)

    async def record_explanation(self, payload: Dict[str, object]) -> None:
        async with self._lock:
            self._explanations.append(payload)

    async def summary(self) -> Dict[str, object]:
        async with self._lock:
            risk_scores = [entry["risk_score"] for entry in self._risk_scores]
            avg_risk = mean(risk_scores) if risk_scores else 0.0
            return {
                "average_risk_score": round(avg_risk, 4),
                "total_alerts": len(self._alerts),
                "total_customers": len({entry["customer_id"] for entry in self._risk_scores}),
            }

    async def recent_customers(self, limit: int = 50) -> List[Dict[str, object]]:
        async with self._lock:
            return list(list(self._risk_scores)[-limit:])

    async def recent_explanations(self, limit: int = 20) -> List[Dict[str, object]]:
        async with self._lock:
            return list(list(self._explanations)[-limit:])