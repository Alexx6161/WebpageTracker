from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Column, JSON

class TargetBase(SQLModel):
    state: str = Field(index=True)
    listing_id: str = Field(index=True)
    pid: str = Field(index=True)
    suite_id: Optional[str] = Field(default=None, index=True)
    assigned_to: Optional[str] = Field(default=None, index=True)
    url: str
    name: Optional[str] = None
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    status: str = Field(default="active", index=True) # active, paused, error
    mode: str = Field(default="whole") # whole, whole_plus, selections_only
    last_reviewed_at: Optional[datetime] = Field(default=None, index=True)
    last_changed_at: Optional[datetime] = None
    change_count_total: int = Field(default=0, index=True)
    next_check_at: Optional[datetime] = None
    error_count: int = Field(default=0)
    last_http_status: Optional[int] = None
    last_content_hash: Optional[str] = None
    reviewed: bool = Field(default=False)

class Target(TargetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TargetSummary(TargetBase):
    id: int
    created_at: datetime
    updated_at: datetime

class TargetPage(SQLModel):
    items: List[TargetSummary]
    total: int
    page: int
    size: int
    pages: int

class ImportRequestItem(SQLModel):
    state: str
    listing_id: str
    pid: str
    suite_id: str
    assigned_to: str
    url: str

class ImportRequest(SQLModel):
    urls_with_metadata: List[ImportRequestItem]
    defaults: Optional[Dict[str, Any]] = None

class ImportReport(SQLModel):
    imported: int
    errors: int

class TargetUpdate(SQLModel):
    reviewed: Optional[bool] = None

class StatsResponse(SQLModel):
    total_tracked: int
    changed_last_24h: int
    reviewed_last_24h: int
    error_count: int
