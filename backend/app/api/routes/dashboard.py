from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_database_session, get_authenticated_user
from app.models.user import User
from app.services.dashboard import get_dashboard_summary

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=dict)
def dashboard(
    request: Request,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> dict:
    """Get authenticated user's dashboard summary.

    Returns real database aggregates for the logged-in user.
    If auction/bid tables are not yet migrated (Phase 3),
    returns honest zero-valued defaults so the frontend
    can render empty states without fake data.
    """
    user_id_str = str(user.id)
    summary = get_dashboard_summary(db, user_id_str)
    return summary