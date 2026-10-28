from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=500)
    condition: str | None = Field(default=None, max_length=50)
    starting_price: Decimal = Field(default=Decimal('0.00'), ge=Decimal('0.00'))
    minimum_increment: Decimal = Field(default=Decimal('0.01'), ge=Decimal('0.01'))
    closing_time: datetime

    model_config = {"from_attributes": True}


class ListingResponse(BaseModel):
    id: UUID
    title: str
    category: str
    description: str | None
    condition: str | None
    starting_price: Decimal
    minimum_increment: Decimal
    seller_id: UUID
    closed: bool
    closed_at: datetime | None
    created_at: datetime
    version: int

class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    condition: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    starting_price: Decimal | None = Field(default=None, ge=Decimal('0.00'))
    minimum_increment: Decimal | None = Field(default=None, ge=Decimal('0.01'))
    closed: bool | None = Field(default=None)
    version: int | None = Field(default=None)
    
    model_config = {"from_attributes": True}

    model_config = {"from_attributes": True}


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    condition: str | None = Field(default=None, max_length=50)
    starting_price: float | None = Field(default=None, ge=0)
    minimum_increment: float | None = Field(default=None, ge=0)
    closed: bool | None = Field(default=None)

    model_config = {"from_attributes": True}