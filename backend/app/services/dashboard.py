from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session


# Lazy import helpers - safely attempt to import auction/bid models
_Auction = None
_Bid = None


def _get_auction_model():
    global _Auction
    if _Auction is None:
        try:
            from app.models.auction import Auction  # type: ignore
            _Auction = Auction
        except ImportError:
            _Auction = None
    return _Auction


def _get_bid_model():
    global _Bid
    if _Bid is None:
        try:
            from app.models.bid import Bid  # type: ignore
            _Bid = Bid
        except ImportError:
            _Bid = None
    return _Bid


def get_dashboard_summary(db: Session, user_id: str) -> Dict[str, Any]:
    """Get dashboard summary for an authenticated user.

    Uses database aggregates. If auction/bid tables don't exist (Phase 3 not run),
    returns zero-valued defaults so the API contract can be extended without
    fake seed data. Always returns typed keys so the frontend can render
    without pretending data exists.
    """
    auction = _get_auction_model()
    bid = _get_bid_model()

    # Initialize all values to defaults
    result: Dict[str, Any] = {
        "active_auctions": 0,
        "leading_auctions": 0,
        "user_bids_count": 0,
        "selling_activity": 0,
        "top_price_achieved": 0.0,
        "last_updated": datetime.utcnow(),
    }

    if auction is None or bid is None:
        # Auction tables not yet available - return honest zeros
        result["_schema_missing"] = True
        return result

    try:
        # Active auctions in the system
        active_auctions = db.scalar(
            func.count().select_from(auction).where(auction.is_active == True)
        )
        result["active_auctions"] = int(active_auctions) if active_auctions else 0

        # Auctions the user is leading (created by user)
        leading_auctions = db.scalar(
            func.count().select_from(auction).where(
                auction.seller_id == user_id, auction.is_active == True
            )
        )
        result["leading_auctions"] = int(leading_auctions) if leading_auctions else 0

        # User's bid count
        user_bids_count = db.scalar(
            func.count().select_from(bid).where(bid.bidder_id == user_id)
        )
        result["user_bids_count"] = int(user_bids_count) if user_bids_count else 0

        # Selling activity: active auctions user created
        selling_activity = db.scalar(
            func.count().select_from(auction).where(
                auction.seller_id == user_id, auction.is_active == True
            )
        )
        result["selling_activity"] = int(selling_activity) if selling_activity else 0

        # Top price from user's bids
        if bid and hasattr(bid, "amount"):
            top_price = db.scalar(
                func.max(bid.amount).select_from(bid).where(bid.bidder_id == user_id)
            )
            result["top_price_achieved"] = float(top_price) if top_price else 0.0

    except Exception:
        # If queries fail for any reason, keep defaults
        result["_schema_missing"] = True
        return result

    return result