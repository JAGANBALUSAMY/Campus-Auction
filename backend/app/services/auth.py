import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import HTTPException, Request, Response, status
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.settings import Settings
from app.models.user import User
from app.schemas.auth import LoginRequest, RegistrationRequest

password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash(secrets.token_urlsafe(32))
ACCESS_COOKIE_NAME = "campus_access_token"
CSRF_COOKIE_NAME = "campus_csrf_token"
COOKIE_PATH = "/"
JWT_ALGORITHM = "HS256"


def _error(
    status_code: int, code: str, message: str
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    )


def _secret(settings: Settings) -> str:
    if settings.jwt_secret_key is None:
        raise _error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "authentication_not_configured",
            "Authentication is not configured.",
        )
    return settings.jwt_secret_key.get_secret_value()


def _issue_session(response: Response, user: User, settings: Settings) -> None:
    csrf_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    access_token = jwt.encode(
        {
            "sub": str(user.id),
            "iat": now,
            "exp": expires_at,
            "csrf": csrf_token,
            "type": "access",
        },
        _secret(settings),
        algorithm=JWT_ALGORITHM,
    )
    cookie_options = {
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite.lower(),
        "path": COOKIE_PATH,
        "max_age": settings.access_token_expire_minutes * 60,
    }
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        access_token,
        httponly=True,
        **cookie_options,
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf_token,
        httponly=False,
        **cookie_options,
    )
def _decode_access_token(token: str, settings: Settings) -> dict[str, object]:
    try:
        claims = jwt.decode(
            token,
            _secret(settings),
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat", "csrf", "type"]},
        )
    except jwt.InvalidTokenError:
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "authentication_required",
            "Authentication required.",
        ) from None
    if claims.get("type") != "access":
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "authentication_required",
            "Authentication required.",
        )
    return claims


def get_current_user(request: Request, db: Session) -> User:
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    if not token:
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "authentication_required",
            "Authentication required.",
        )
    claims = _decode_access_token(token, request.app.state.settings)
    try:
        user_id = UUID(str(claims["sub"]))
    except (KeyError, ValueError):
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "authentication_required",
            "Authentication required.",
        ) from None
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "authentication_required",
            "Authentication required.",
        )
    return user


def _validate_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin is not None and origin not in request.app.state.settings.cors_origins:
        raise _error(
            status.HTTP_403_FORBIDDEN,
            "origin_not_allowed",
            "This request origin is not allowed.",
        )


def register_user(
    request: Request,
    payload: RegistrationRequest,
    db: Session,
) -> User:
    _validate_origin(request)
    settings: Settings = request.app.state.settings
    _secret(settings)
    email = str(payload.email).casefold()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise _error(
            status.HTTP_409_CONFLICT,
            "email_already_registered",
            "An account with this email already exists.",
        )
    user = User(
        full_name=payload.full_name,
        email=email,
        password_hash=password_hasher.hash(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        original = error.orig
        diagnostic = getattr(original, "diag", None)
        constraint_name = getattr(diagnostic, "constraint_name", None)
        if (
            getattr(original, "sqlstate", None) == "23505"
            and constraint_name == "uq_users_email"
        ):
            raise _error(
                status.HTTP_409_CONFLICT,
                "email_already_registered",
                "An account with this email already exists.",
            ) from None
        raise
    db.refresh(user)
    return user


def authenticate_user(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session,
) -> User:
    _validate_origin(request)
    settings: Settings = request.app.state.settings
    _secret(settings)
    email = str(payload.email).casefold()
    user = db.scalar(select(User).where(User.email == email))
    password_matches = False
    if user is not None:
        try:
            password_matches = password_hasher.verify(
                payload.password, user.password_hash
            )
        except UnknownHashError:
            password_matches = False
    else:
        password_hasher.verify(payload.password, DUMMY_PASSWORD_HASH)
    if user is None or not password_matches or not user.is_active:
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_credentials",
            "Email or password is incorrect.",
        )
    _issue_session(response, user, settings)
    return user


def logout_user(request: Request, response: Response) -> None:
    _validate_origin(request)
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get("x-csrf-token")
    if token:
        try:
            claims = _decode_access_token(token, request.app.state.settings)
        except HTTPException as error:
            if error.status_code != status.HTTP_401_UNAUTHORIZED:
                raise
        else:
            expected_csrf = claims.get("csrf")
            if (
                not isinstance(expected_csrf, str)
                or not isinstance(csrf_cookie, str)
                or not isinstance(csrf_header, str)
                or not secrets.compare_digest(expected_csrf, csrf_cookie)
                or not secrets.compare_digest(expected_csrf, csrf_header)
            ):
                raise _error(
                    status.HTTP_403_FORBIDDEN,
                    "csrf_validation_failed",
                    "The request could not be verified.",
                )
    cookie_options = {
        "secure": request.app.state.settings.auth_cookie_secure,
        "samesite": request.app.state.settings.auth_cookie_samesite.lower(),
        "path": COOKIE_PATH,
    }
    response.delete_cookie(ACCESS_COOKIE_NAME, httponly=True, **cookie_options)
    response.delete_cookie(CSRF_COOKIE_NAME, httponly=False, **cookie_options)
