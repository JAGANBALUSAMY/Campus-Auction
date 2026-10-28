from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ListingCondition(str, Enum):
    new = "new"
    used = "used"
    refurbished = "refurbished"


class ListingStatus(str, Enum):
    draft = "draft"
    active = "active"
    cancelled = "cancelled"


class ListingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=1000)
    condition: ListingCondition
    starting_price: Decimal = Field(..., ge=0, max_digits=10, decimal_places=2)
    minimum_increment: Decimal = Field(
        ..., ge=0, max_digits=10, decimal_places=2
    )


class ListingCreate(ListingBase):
    closing_at: datetime


class ListingUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=1000)
    condition: ListingCondition | None = None
    starting_price: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    minimum_increment: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    closing_at: datetime | None = None


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    seller_id: UUID
    title: str
    category: str
    description: str | None
    condition: str
    starting_price: Decimal
    minimum_increment: Decimal
    closing_at: datetime
    status: ListingStatus
    created_at: datetime
    updated_at: datetime

    # The current Listing model does not define a photos relationship.
    photos: list[str] = []