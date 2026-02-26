from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import List, Optional

from .database import create_db_and_tables, get_session
from .models import TargetPage, ImportRequest, ImportReport, TargetSummary, TargetUpdate, StatsResponse
from .crud import list_targets, import_targets, update_target, get_dashboard_stats, get_unique_states, delete_targets
from .tracker import check_all_targets

app = FastAPI(title="Webpage Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/api/targets", response_model=TargetPage)
def get_targets(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = None,
    states: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = None,
    sort_desc: bool = False,
    session: Session = Depends(get_session)
):
    return list_targets(
        session=session,
        page=page,
        size=size,
        search=search,
        states=states,
        statuses=statuses,
        sort_by=sort_by,
        sort_desc=sort_desc
    )

@app.post("/api/targets/import", response_model=ImportReport)
def perform_import(
    request: ImportRequest,
    session: Session = Depends(get_session)
):
    result = import_targets(
        session=session,
        items=request.urls_with_metadata,
        defaults=request.defaults
    )
    return result

@app.put("/api/targets/{target_id}", response_model=TargetSummary)
def update_target_endpoint(
    target_id: int,
    target_update: TargetUpdate,
    session: Session = Depends(get_session)
):
    from fastapi import HTTPException
    target = update_target(session, target_id, target_update)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(session: Session = Depends(get_session)):
    return get_dashboard_stats(session)

@app.get("/api/targets/states", response_model=List[str])
def get_states_endpoint(session: Session = Depends(get_session)):
    return get_unique_states(session)

@app.delete("/api/targets")
def delete_targets_endpoint(
    states: Optional[List[str]] = Query(None),
    session: Session = Depends(get_session)
):
    deleted_count = delete_targets(session, states)
    return {"message": f"Successfully deleted {deleted_count} targets", "count": deleted_count}

@app.post("/api/check-all")
def trigger_check_all():
    count = check_all_targets()
    return {"message": f"Successfully checked {count} targets", "count": count}
