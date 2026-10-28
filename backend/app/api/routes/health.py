import logging

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.schemas.health import HealthReadyResponse, HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="campus-auction-api")


@router.get("/health/ready", response_model=HealthReadyResponse)
def readiness(request: Request) -> HealthReadyResponse:
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "database_not_configured",
                "message": "Database is not configured.",
            },
        )

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.warning("Database readiness probe failed.")
        raise HTTPException(
            status_code=503,
            detail={
                "code": "database_unavailable",
                "message": "Database is not ready.",
            },
        ) from None

    return HealthReadyResponse(status="ready", database="connected")
