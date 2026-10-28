from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str


class HealthReadyResponse(BaseModel):
    status: Literal["ready"]
    database: Literal["connected"]
