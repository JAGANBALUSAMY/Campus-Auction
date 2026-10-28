from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.listing import Listing, ListingStatus
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingResponse,
    ListingUpdate,
)


def _to_read(listing: Listing) -> ListingResponse:
    return ListingResponse(
        id=listing.id,
        seller_id=listing.seller_id,
        title=listing.title,
        category=listing.category,
        description=listing.description,
        condition=listing.condition,
        starting_price=listing.starting_price,
        minimum_increment=listing.minimum_increment,
        closing_at=listing.closing_at,
        status=listing.status,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        photos=[],
    )


def create_listing(
    db: Session,
    user: User,
    payload: ListingCreate,
) -> ListingResponse:
    closing_at = payload.closing_at

    if closing_at.tzinfo is None:
        closing_at = closing_at.replace(tzinfo=timezone.utc)

    if closing_at <= datetime.now(timezone.utc):
        raise ValueError("Closing time must be in the future.")

    new_listing = Listing(
        seller_id=user.id,
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description,
        condition=payload.condition.value,
        starting_price=payload.starting_price,
        minimum_increment=payload.minimum_increment,
        closing_at=closing_at,
        status=ListingStatus.DRAFT.value,
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return _to_read(new_listing)


def get_my_listings(db: Session, user: User) -> list[ListingResponse]:
    listings = (
        db.query(Listing)
        .filter(Listing.seller_id == user.id)
        .order_by(Listing.created_at.desc())
        .all()
    )

    return [_to_read(listing) for listing in listings]


def get_listing(db: Session, listing_id: UUID) -> ListingResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()

    if listing is None:
        raise ValueError("Listing not found.")

    return _to_read(listing)


def update_listing(
    db: Session,
    user: User,
    listing_id: UUID,
    payload: ListingUpdate,
) -> ListingResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()

    if listing is None:
        raise ValueError("Listing not found.")

    if listing.seller_id != user.id:
        raise PermissionError("You cannot edit another seller's listing.")

    if not listing.is_editable():
        raise ValueError("Only draft listings can be edited.")

    update_data = payload.model_dump(exclude_unset=True)

    if "closing_at" in update_data and update_data["closing_at"] is not None:
        closing_at = update_data["closing_at"]

        if closing_at.tzinfo is None:
            closing_at = closing_at.replace(tzinfo=timezone.utc)

        if closing_at <= datetime.now(timezone.utc):
            raise ValueError("Closing time must be in the future.")

        update_data["closing_at"] = closing_at

    if "title" in update_data and update_data["title"] is not None:
        update_data["title"] = update_data["title"].strip()

    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = update_data["category"].strip()

    if "condition" in update_data and update_data["condition"] is not None:
        update_data["condition"] = update_data["condition"].value

    for key, value in update_data.items():
        setattr(listing, key, value)

    listing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(listing)

    return _to_read(listing)


def cancel_listing(
    db: Session,
    user: User,
    listing_id: UUID,
) -> ListingResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()

    if listing is None:
        raise ValueError("Listing not found.")

    if listing.seller_id != user.id:
        raise PermissionError("You cannot cancel another seller's listing.")

    if not listing.is_cancellable():
        raise ValueError("This listing cannot be cancelled.")

    listing.status = ListingStatus.CANCELLED.value
    listing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(listing)

    return _to_read(listing)