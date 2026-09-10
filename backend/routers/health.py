"""Health check endpoint — no authentication required."""

from fastapi import APIRouter

from backend.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="ok", version="1.0.0", gateway="online")
