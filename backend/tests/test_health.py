from fastapi.testclient import TestClient

from app.core.settings import Settings
from app.main import create_app


def test_health_reports_application_status_without_database_details() -> None:
    with TestClient(create_app(Settings())) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "campus-auction-api",
    }


def test_readiness_is_unavailable_without_database_configuration() -> None:
    with TestClient(create_app(Settings(database_url=None))) as client:
        response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "database_not_configured",
            "message": "Database is not configured.",
        }
    }


def test_configured_frontend_origin_can_call_api() -> None:
    settings = Settings(cors_allowed_origins="http://localhost:5173")
    with TestClient(create_app(settings)) as client:
        response = client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:5173"},
        )

    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"] == "http://localhost:5173"
    )
