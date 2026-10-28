from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_database_session, get_authenticated_user
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingResponse,
    ListingUpdate,
)
from typing import List

from app.services.listing import (
    create_listing,
    get_listing,
    update_listing,
    cancel_listing,
    get_my_listings,
)

router = APIRouter(tags=["listings"])


@router.post("/listings", response_model=ListingResponse, status_code=201)
def create_listing_endpoint(
    payload: ListingCreate,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> dict:
    """Create a new listing. Only the authenticated seller can create it."""
    return create_listing(db, user, payload)


@router.get("/listings/mine", response_model=list[ListingResponse])
def get_my_listings_endpoint(
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> list[ListingResponse]:
    """Return all listings belonging to the authenticated user."""
    return get_my_listings(db, user)



@router.patch("/listings/{listing_id}", response_model=ListingResponse)
def update_listing_endpoint(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> dict:
    """Update a listing. Only the seller can edit, and only if bidding hasn't begun."""
    return update_listing(db, user, listing_id, payload)


@router.post("/listings/{listing_id}/cancel", response_model=ListingResponse)
def cancel_listing_endpoint(
    listing_id: int,
    db: Session = Depends(get_database_session),
    user: User = Depends(get_authenticated_user),
) -> dict:
    """Cancel a listing. Only the seller can cancel."""
    return cancel_listing(db, user, listing_id)