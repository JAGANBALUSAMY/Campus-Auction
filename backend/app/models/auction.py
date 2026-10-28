import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Auction(Base):
    __tablename__ = "auctions"

    __table_args__ = (
        CheckConstraint(
            "length(trim(title)) > 0", name="title_not_empty"
        ),
        CheckConstraint(
            "starting_price >= 0", name="starting_price_non_negative"
        ),
        CheckConstraint(
            "length(trim(category)) > 0", name="category_not_empty"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    description: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    condition: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    starting_price: Mapped[float] = mapped_column(
        nullable=False, default=0.0
    )
    minimum_increment: Mapped[float] = mapped_column(
        nullable=False, default=0.01
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), nullable=False
    )
    closed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    # Photo references - comma-separated file paths
    photos: Mapped[str | None] = mapped_column(
        String(500), nullable=True, default=None
    )