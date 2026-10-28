from pwdlib import PasswordHash

import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.models.user import User
from sqlalchemy import select
from sqlalchemy.orm import Session


VALID_REGISTRATION = {
    "full_name": "Campus Student",
    "email": "student@example.edu",
    "password": "a-secure-campus-password",
}


def register(client: TestClient, email: str = "student@example.edu") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={**VALID_REGISTRATION, "email": email},
    )
    assert response.status_code == 201
    return response.json()


def test_registration_normalizes_email_and_returns_public_profile(
    client: TestClient,
) -> None:
    profile = register(client, "  Student@Example.edu  ")

    assert profile["email"] == "student@example.edu"
    assert profile["full_name"] == "Campus Student"
    assert "password_hash" not in profile
    assert "password" not in profile
    assert "campus_access_token" not in client.cookies


def test_registration_rejects_invalid_email_and_password(client: TestClient) -> None:
    invalid_email = client.post(
        "/api/v1/auth/register",
        json={**VALID_REGISTRATION, "email": "not-an-email"},
    )
    weak_password = client.post(
        "/api/v1/auth/register",
        json={**VALID_REGISTRATION, "password": "short"},
    )

    assert invalid_email.status_code == 422
    assert invalid_email.json()["error"]["code"] == "validation_error"
    assert weak_password.status_code == 422
    assert weak_password.json()["error"]["code"] == "validation_error"


def test_duplicate_registration_is_conflict_even_with_email_case_changes(
    client: TestClient,
) -> None:
    register(client)
    duplicate = client.post(
        "/api/v1/auth/register",
        json={**VALID_REGISTRATION, "email": "STUDENT@EXAMPLE.EDU"},
    )

    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "email_already_registered"
    assert "password_hash" not in duplicate.text


def test_concurrent_duplicate_registrations_only_create_one_account(
    client: TestClient,
) -> None:
    payload = {**VALID_REGISTRATION, "email": "concurrent@example.edu"}
    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(
            executor.map(
                lambda _: client.post("/api/v1/auth/register", json=payload),
                range(2),
            )
        )

    assert sorted(response.status_code for response in responses) == [201, 409]


def test_password_is_hashed_in_database(client: TestClient) -> None:
    profile = register(client)
    engine = client.app.state.engine
    with Session(engine) as session:
        user = session.scalar(select(User).where(User.email == profile["email"]))

    assert user is not None
    assert user.password_hash != VALID_REGISTRATION["password"]
    assert PasswordHash.recommended().verify(
        VALID_REGISTRATION["password"], user.password_hash
    )
    assert user.id is not None
    assert user.created_at.tzinfo is not None
    assert user.updated_at.tzinfo is not None


def test_login_sets_http_only_session_and_current_user_survives_reload(
    client: TestClient,
) -> None:
    profile = register(client)
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "STUDENT@EXAMPLE.EDU",
            "password": VALID_REGISTRATION["password"],
        },
    )

    assert login.status_code == 200
    assert login.json() == {"user": profile}
    assert "password_hash" not in login.text
    assert login.headers["cache-control"] == "no-store"
    session_cookie = login.cookies.get("campus_access_token")
    assert session_cookie is not None
    session_header = next(
        header
        for header in login.headers.get_list("set-cookie")
        if header.startswith("campus_access_token=")
    )
    assert "httponly" in session_header.lower()
    assert "samesite=lax" in session_header.lower()

    current_user = client.get("/api/v1/auth/me")
    assert current_user.status_code == 200
    assert current_user.json() == profile
    assert current_user.headers["cache-control"] == "no-store"
    assert "password_hash" not in current_user.text


def test_invalid_credentials_do_not_reveal_account_existence(
    client: TestClient,
) -> None:
    register(client)
    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "wrong-password"},
    )
    unknown_email = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.edu", "password": "wrong-password"},
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_current_user_rejects_missing_and_invalid_sessions(client: TestClient) -> None:
    missing = client.get("/api/v1/auth/me")
    assert missing.status_code == 401
    assert missing.json()["error"]["code"] == "authentication_required"

    client.cookies.set("campus_access_token", "invalid-token")
    invalid = client.get("/api/v1/auth/me")
    assert invalid.status_code == 401


def test_logout_requires_csrf_token_and_clears_session(client: TestClient) -> None:
    register(client)
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": VALID_REGISTRATION["email"],
            "password": VALID_REGISTRATION["password"],
        },
    )
    assert login.status_code == 200

    csrf_token = client.cookies.get("campus_csrf_token")
    assert csrf_token
    forbidden = client.post("/api/v1/auth/logout")
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "csrf_validation_failed"

    logout = client.post(
        "/api/v1/auth/logout",
        headers={"X-CSRF-Token": csrf_token},
    )
    assert logout.status_code == 204
    cleared_cookies = "\n".join(logout.headers.get_list("set-cookie")).lower()
    assert "campus_access_token=" in cleared_cookies
    assert "max-age=0" in cleared_cookies
    assert client.get("/api/v1/auth/me").status_code == 401


def test_rejects_disallowed_browser_origin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "incorrect"},
        headers={"Origin": "https://untrusted.example"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "origin_not_allowed"


def test_production_settings_require_secure_cookies() -> None:
    from pydantic import SecretStr, ValidationError

    from app.core.settings import Settings

    try:
        Settings(
            environment="production",
            jwt_secret_key=SecretStr(
                "test-only-secret-key-with-at-least-32-characters"
            ),
            auth_cookie_secure=False,
        )
    except ValidationError:
        return
    raise AssertionError("Production settings must require secure cookies.")


def test_expired_session_credentials_are_rejected(client: TestClient) -> None:
    profile = register(client)
    now = datetime.now(timezone.utc)
    expired_token = jwt.encode(
        {
            "sub": str(profile["id"]),
            "iat": now - timedelta(minutes=30),
            "exp": now - timedelta(minutes=15),
            "csrf": "x",
            "type": "access",
        },
        "test-only-secret-key-with-at-least-32-characters",
        algorithm="HS256",
    )
    client.cookies.set("campus_access_token", expired_token)
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_required"
from concurrent.futures import ThreadPoolExecutor
