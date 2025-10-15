"""REST endpoints exposing aggregated insights."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from ..state import RiskState

router = APIRouter(prefix="/api", tags=["summary"])


def get_state() -> RiskState:
    from ..server import risk_state

    return risk_state


@router.get("/summary")
async def get_summary(state: RiskState = Depends(get_state)) -> dict:
    return await state.summary()


@router.get("/customers")
async def get_customers(state: RiskState = Depends(get_state)) -> dict:
    customers = await state.recent_customers()
    return {"customers": customers}