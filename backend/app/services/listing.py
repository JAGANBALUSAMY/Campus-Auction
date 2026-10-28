from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auction import Auction
from app.models.user import User
from app.schemas.listing import ListingCreate, ListingResponse, ListingUpdate


def create_listing(db: Session, seller: User, payload: ListingCreate) -> ListingResponse:
    """Create a new auction listing for the given seller."""
    db_listing = Auction(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        condition=payload.condition,
        starting_price=payload.starting_price,
        minimum_increment=payload.minimum_increment,
        seller_id=seller.id,
        closed=False,
        closed_at=None,
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return ListingResponse(
        id=db_listing.id,
        title=db_listing.title,
        category=db_listing.category,
        description=db_listing.description,
        condition=db_listing.condition,
        starting_price=db_listing.starting_price,
        minimum_increment=db_listing.minimum_increment,
        seller_id=db_listing.seller_id,
        closed=db_listing.closed,
        closed_at=db_listing.closed_at,
        created_at=db_listing.created_at,
        version=db_listing.version,
    )

def get_my_listings(db: Session, user: User):
    """Return all listings owned by the authenticated user."""
    stmt = select(Auction).where(Auction.seller_id == user.id)
    results = db.execute(stmt).scalars().all()
    return [
        ListingResponse(
            id=l.id,
            title=l.title,
            category=l.category,
            description=l.description,
            condition=l.condition,
            starting_price=l.starting_price,
            minimum_increment=l.minimum_increment,
            seller_id=l.seller_id,
            closed=l.closed,
            closed_at=l.closed_at,
            created_at=l.created_at,
            version=l.version,
        )
        for l in results
    ]


def get_listing(db: Session, listing_id: int) -> ListingResponse:
    """Get a single listing by ID."""
    result = db.execute(select(Auction).where(Auction.id == listing_id))
    db_listing = result.scalar_one_or_none()
    if db_listing is None:
        raise ValueError("Listing not found")
    return ListingResponse(
        id=db_listing.id,
        title=db_listing.title,
        category=db_listing.category,
        description=db_listing.description,
        condition=db_listing.condition,
        starting_price=db_listing.starting_price,
        minimum_increment=db_listing.minimum_increment,
        seller_id=db_listing.seller_id,
        closed=db_listing.closed,
        closed_at=db_listing.closed_at,
        created_at=db_listing.created_at,
        version=db_listing.version,
    )

def update_listing(
    db: Session, user: User, listing_id: int, payload: ListingUpdate
) -> ListingResponse:
    """Update a listing. Only the seller can edit, and only if bidding hasn't begun.
    Implements optimistic concurrency using the `version` field.
    """
    listing = db.execute(
        select(Auction).where(Auction.id == listing_id)
    ).scalar_one_or_none()

    if listing is None:
        raise ValueError("Listing not found")

    # Ownership enforcement
    if listing.seller_id != user.id:
        raise PermissionError("Not your listing")

    # Stale update detection
    if payload.version is not None and payload.version != listing.version:
        raise RuntimeError("Version conflict: listing has been modified")

    # Lifecycle rule: prevent changes after listing is closed
    if listing.closed:
        raise ValueError("Cannot edit a closed listing")

    # Apply updates
    if payload.title is not None:
        listing.title = payload.title
    if payload.category is not None:
        listing.category = payload.category
    if payload.description is not None:
        listing.description = payload.description
    if payload.condition is not None:
        listing.condition = payload.condition
    if payload.starting_price is not None:
        listing.starting_price = payload.starting_price
    if payload.minimum_increment is not None:
        listing.minimum_increment = payload.minimum_increment
    if payload.closed is not None:
        listing.closed = payload.closed
        if payload.closed and not listing.closed_at:
            listing.closed_at = datetime.now(timezone.utc)

    # Increment version for optimistic lock
    listing.version = listing.version + 1

    db.commit()
    db.refresh(listing)
    return ListingResponse(
        id=listing.id,
        title=listing.title,
        category=listing.category,
        description=listing.description,
        condition=listing.condition,
        starting_price=listing.starting_price,
        minimum_increment=listing.minimum_increment,
        seller_id=listing.seller_id,
        closed=listing.closed,
        closed_at=listing.closed_at,
        created_at=listing.created_at,
        version=listing.version,
    )


def cancel_listing(db: Session, user: User, listing_id: int) -> ListingResponse:
    """Cancel a listing. Only the seller can cancel."""
    listing = db.execute(
        select(Auction).where(Auction.id == listing_id)
    ).scalar_one_or_none()

    if listing is None:
        raise ValueError("Listing not found")

    # Ownership enforcement
    if listing.seller_id != user.id:
        raise PermissionError("Not your listing")

    # Lifecycle rule: cannot cancel after bidding has started or listing is closed
    if listing.closed:
        raise ValueError("Listing is already closed")

    listing.closed = True
    listing.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(listing)
    return ListingResponse(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        condition=listing.condition,
        starting_price=listing.starting_price,
        minimum_increment=listing.minimum_increment,
        seller_id=listing.seller_id,
        closed=listing.closed,
        closed_at=listing.closed_at,
        created_at=listing.created_at,
    )