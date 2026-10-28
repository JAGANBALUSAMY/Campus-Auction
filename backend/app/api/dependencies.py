from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth import get_current_user


def get_database_session(request: Request) -> Generator[Session, None, None]:
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "database_not_configured",
                "message": "Database is not configured.",
            },
        )
    with Session(engine) as session:
        yield session


def get_authenticated_user(
    request: Request,
    db: Session = Depends(get_database_session),
) -> User:
    return get_current_user(request, db)
