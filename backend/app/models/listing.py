from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List

import sqlalchemy as sa
from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum

from app.models.base import Base


class ListingStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CANCELLED = "cancelled"


class Listing(Base):
    __tablename__ = "listings"

    __table_args__ = (
        CheckConstraint("length(trim(title)) > 0", name="title_not_empty"),
        CheckConstraint("starting_price >= 0", name="starting_price_non_negative"),
        CheckConstraint("minimum_increment >= 0", name="min_increment_non_negative"),
        CheckConstraint("length(trim(category)) > 0", name="category_not_empty"),
        CheckConstraint("length(trim(condition)) > 0", name="condition_not_empty"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    condition: Mapped[str] = mapped_column(String(50), nullable=False)
    starting_price: Mapped[Decimal] = mapped_column(sa.Numeric(10, 2), nullable=False)
    minimum_increment: Mapped[Decimal] = mapped_column(sa.Numeric(10, 2), nullable=False)
    closing_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    def is_editable(self) -> bool:
        return self.status == ListingStatus.DRAFT

    def is_cancellable(self) -> bool:
        return self.status in {ListingStatus.DRAFT, ListingStatus.ACTIVE}