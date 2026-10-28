from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_authenticated_user,
    get_database_session,
)
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingResponse,
    ListingUpdate,
)
from app.services.listing import (
    cancel_listing,
    create_listing,
    get_listing,
    get_my_listings,
    update_listing,
)

router = APIRouter(tags=["listings"])


def _handle_listing_error(error: Exception) -> None:
    if isinstance(error, PermissionError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    if str(error) == "Listing not found.":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(error),
    ) from error


@router.post(
    "/listings",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing_endpoint(
    payload: ListingCreate,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> ListingResponse:
    try:
        return create_listing(db, user, payload)
    except (ValueError, PermissionError) as error:
        _handle_listing_error(error)


@router.get(
    "/listings/mine",
    response_model=list[ListingResponse],
)
def get_my_listings_endpoint(
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> list[ListingResponse]:
    return get_my_listings(db, user)


@router.get(
    "/listings/{listing_id}",
    response_model=ListingResponse,
)
def get_listing_endpoint(
    listing_id: UUID,
    db: Session = Depends(get_database_session),
) -> ListingResponse:
    try:
        return get_listing(db, listing_id)
    except ValueError as error:
        _handle_listing_error(error)


@router.patch(
    "/listings/{listing_id}",
    response_model=ListingResponse,
)
def update_listing_endpoint(
    listing_id: UUID,
    payload: ListingUpdate,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> ListingResponse:
    try:
        return update_listing(db, user, listing_id, payload)
    except (ValueError, PermissionError) as error:
        _handle_listing_error(error)


@router.post(
    "/listings/{listing_id}/cancel",
    response_model=ListingResponse,
)
def cancel_listing_endpoint(
    listing_id: UUID,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> ListingResponse:
    try:
        return cancel_listing(db, user, listing_id)
    except (ValueError, PermissionError) as error:
        _handle_listing_error(error)