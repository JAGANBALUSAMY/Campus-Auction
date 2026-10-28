import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from dotenv import dotenv_values
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.settings import Settings
from app.main import create_app
from app.models.user import User


ROOT = Path(__file__).resolve().parents[2]
ENVIRONMENT = dotenv_values(ROOT / ".env")
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL") or ENVIRONMENT.get(
    "TEST_DATABASE_URL"
)


@pytest.fixture
def client() -> Iterator[TestClient]:
    if not TEST_DATABASE_URL:
        pytest.fail(
            "Set TEST_DATABASE_URL in the root .env to a dedicated PostgreSQL "
            "test database and run its Alembic migrations."
        )
    if not TEST_DATABASE_URL.rsplit("/", 1)[-1].split("?", 1)[0].endswith("_test"):
        pytest.fail("Authentication tests only run against a database ending in _test.")

    settings = Settings(
        database_url=SecretStr(TEST_DATABASE_URL),
        jwt_secret_key=SecretStr("test-only-secret-key-with-at-least-32-characters"),
        cors_allowed_origins="http://localhost:5173",
    )
    with TestClient(create_app(settings)) as test_client:
        yield test_client
        engine = test_client.app.state.engine
        with Session(engine) as session:
            session.execute(delete(User))
            session.commit()
