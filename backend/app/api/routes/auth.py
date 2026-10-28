from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_authenticated_user, get_database_session
from app.models.user import User
from app.schemas.auth import (
    AuthenticatedResponse,
    LoginRequest,
    RegistrationRequest,
    UserProfile,
)
from app.services.auth import authenticate_user, logout_user, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegistrationRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_database_session),
) -> User:
    response.headers["Cache-Control"] = "no-store"
    return register_user(request, payload, db)


@router.post("/login", response_model=AuthenticatedResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_database_session),
) -> AuthenticatedResponse:
    response.headers["Cache-Control"] = "no-store"
    user = authenticate_user(request, response, payload, db)
    return AuthenticatedResponse(user=UserProfile.model_validate(user))


@router.get("/me", response_model=UserProfile)
def me(
    response: Response,
    user: User = Depends(get_authenticated_user),
) -> User:
    response.headers["Cache-Control"] = "no-store"
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response) -> Response:
    logout_user(request, response)
    response.headers["Cache-Control"] = "no-store"
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
