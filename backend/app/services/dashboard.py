
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _get_auction_model():
    try:
        from app.models.auction import Auction
        return Auction
    except ImportError:
        logger.warning("Auction model is unavailable")
        return None


def _get_bid_model():
    try:
        from app.models.bid import Bid
        return Bid
    except ImportError:
        logger.warning("Bid model is unavailable")
        return None


def _get_listing_model():
    try:
        from app.models.listing import Listing
        return Listing
    except ImportError:
        logger.exception("Could not import Listing model")
        return None


def _count(query) -> int:
    value = query.scalar()
    return int(value or 0)


def get_dashboard_summary(
    db: Session,
    user_id: Any,
) -> dict[str, Any]:
    """Return dashboard statistics for the authenticated user."""

    result: dict[str, Any] = {
        "active_auctions": 0,
        "leading_auctions": 0,
        "user_bids_count": 0,
        "selling_activity": 0,
        "total_listings": 0,
        "active_listings": 0,
        "draft_listings": 0,
        "top_price_achieved": 0.0,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    # 1. Listing statistics
    Listing = _get_listing_model()

    if Listing is None:
        result["_schema_missing"] = True
        return result

    try:
        result["total_listings"] = _count(
            db.query(func.count(Listing.id)).filter(
                Listing.seller_id == user_id
            )
        )

        result["active_listings"] = _count(
            db.query(func.count(Listing.id)).filter(
                Listing.seller_id == user_id,
                func.lower(Listing.status) == "active",
            )
        )

        result["draft_listings"] = _count(
            db.query(func.count(Listing.id)).filter(
                Listing.seller_id == user_id,
                func.lower(Listing.status) == "draft",
            )
        )

    except Exception:
        logger.exception("Failed to load listing statistics")
        # Do not silently present incorrect zero counts.
        raise

    
    # 2. Auction statistics
    Auction = _get_auction_model()

    if Auction is not None:
        try:
            auction_columns = {
                column.name for column in Auction.__table__.columns
            }

            # Count active auctions only if the model has a status field.
            if "status" in auction_columns:
                result["active_auctions"] = _count(
                    db.query(func.count(Auction.id)).filter(
                        func.lower(Auction.status) == "active"
                    )
                )
            elif "is_active" in auction_columns:
                result["active_auctions"] = _count(
                    db.query(func.count(Auction.id)).filter(
                        Auction.is_active.is_(True)
                    )
                )

            # Count auctions created by this user.
            if "seller_id" in auction_columns:
                seller_query = db.query(func.count(Auction.id)).filter(
                    Auction.seller_id == user_id
                )

                if "status" in auction_columns:
                    seller_query = seller_query.filter(
                        func.lower(Auction.status) == "active"
                    )
                elif "is_active" in auction_columns:
                    seller_query = seller_query.filter(
                        Auction.is_active.is_(True)
                    )

                result["leading_auctions"] = _count(seller_query)
                result["selling_activity"] = result["leading_auctions"]

        except Exception:
            logger.exception("Failed to load auction statistics")
            db.rollback()


    # 3. Bid statistics
    Bid = _get_bid_model()

    if Bid is not None:
        try:
            result["user_bids_count"] = _count(
                db.query(func.count(Bid.id)).filter(
                    Bid.bidder_id == user_id
                )
            )

            if hasattr(Bid, "amount"):
                top_price = (
                    db.query(func.max(Bid.amount))
                    .filter(Bid.bidder_id == user_id)
                    .scalar()
                )

                if top_price is not None:
                    result["top_price_achieved"] = float(
                        top_price
                        if isinstance(top_price, Decimal)
                        else Decimal(str(top_price))
                    )

        except Exception:
            logger.exception("Failed to load bid statistics")
            db.rollback()

    return result
