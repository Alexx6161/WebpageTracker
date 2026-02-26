from typing import List, Optional, Any
from sqlmodel import Session, select, func, or_, desc, asc
from .models import Target, TargetPage, TargetSummary, ImportRequestItem, TargetUpdate
from datetime import datetime, timezone

def list_targets(
    session: Session,
    page: int = 1,
    size: int = 50,
    search: Optional[str] = None,
    states: Optional[List[str]] = None,
    statuses: Optional[List[str]] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = False
) -> TargetPage:
    query = select(Target)

    # Filtering
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Target.url.like(search_filter),
                Target.listing_id.like(search_filter),
                Target.pid.like(search_filter)
            )
        )
    if states:
        query = query.where(Target.state.in_(states))
    if statuses:
        query = query.where(Target.status.in_(statuses))

    # Total Count
    count_query = select(func.count(Target.id))
    
    if search:
        count_query = count_query.where(
            or_(
                Target.url.like(search_filter),
                Target.listing_id.like(search_filter),
                Target.pid.like(search_filter)
            )
        )
    if states:
        count_query = count_query.where(Target.state.in_(states))
    if statuses:
        count_query = count_query.where(Target.status.in_(statuses))

    total = session.exec(count_query).one()

    # Sorting
    if sort_by:
        sort_col = getattr(Target, sort_by, None)
        if sort_col is not None:
            if sort_desc:
                query = query.order_by(desc(sort_col))
            else:
                query = query.order_by(asc(sort_col))
    else:
        # default sort
        query = query.order_by(Target.id)

    # Pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    
    results = session.exec(query).all()
    items = [TargetSummary.model_validate(r) for r in results]
    
    pages = (total + size - 1) // size

    return TargetPage(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

def import_targets(
    session: Session,
    items: List[ImportRequestItem],
    defaults: dict[str, Any] | None = None
) -> dict:
    errors = 0
    imported = 0
    
    if defaults is None:
        defaults = {}
        
    for item in items:
        try:
            target = Target(
                state=item.state,
                listing_id=item.listing_id,
                pid=item.pid,
                suite_id=item.suite_id,
                assigned_to=item.assigned_to,
                url=item.url,
                **defaults
            )
            now = datetime.now(timezone.utc)
            target.created_at = now
            target.updated_at = now
            session.add(target)
            imported += 1
        except Exception as e:
            print(f"Error importing {item.url}: {e}")
            errors += 1
            
    session.commit()
    return {"imported": imported, "errors": errors}

def update_target(
    session: Session,
    target_id: int,
    target_update: TargetUpdate
) -> Optional[Target]:
    target = session.get(Target, target_id)
    if not target:
        return None
    if target_update.reviewed is not None:
        target.reviewed = target_update.reviewed
        target.last_reviewed_at = datetime.now(timezone.utc)
    target.updated_at = datetime.now(timezone.utc)
    session.add(target)
    session.commit()
    session.refresh(target)
    return target

def record_target_check(
    session: Session,
    target_id: int,
    http_status: int,
    content_hash: Optional[str] = None,
    error_msg: Optional[str] = None
) -> Optional[Target]:
    target = session.get(Target, target_id)
    if not target:
        return None
    
    now = datetime.now(timezone.utc)
    target.updated_at = now
    target.last_http_status = http_status
    
    if error_msg:
        target.status = "error"
        target.error_count += 1
    else:
        target.status = "active"
        # Check for changes
        if content_hash and target.last_content_hash and content_hash != target.last_content_hash:
            target.change_count_total += 1
            target.last_changed_at = now
            target.reviewed = False # Reset review flag on change
        
        if content_hash:
            target.last_content_hash = content_hash

    session.add(target)
    session.commit()
    session.refresh(target)
    return target

def get_dashboard_stats(session: Session) -> dict:
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    total_tracked = session.exec(select(func.count(Target.id))).one()
    
    changed_last_24h = session.exec(
        select(func.count(Target.id)).where(Target.updated_at >= twenty_four_hours_ago)
    ).one()
    
    reviewed_last_24h = session.exec(
        select(func.count(Target.id)).where(
            Target.updated_at >= twenty_four_hours_ago,
            Target.reviewed == True
        )
    ).one()
    
    error_count = session.exec(
        select(func.count(Target.id)).where(Target.status == "error")
    ).one()
    
    return {
        "total_tracked": total_tracked,
        "changed_last_24h": changed_last_24h,
        "reviewed_last_24h": reviewed_last_24h,
        "error_count": error_count
    }

def get_unique_states(session: Session) -> List[str]:
    """Returns a list of unique states currently present in the database."""
    query = select(Target.state).distinct().order_by(Target.state)
    results = session.exec(query).all()
    return list(results)

def delete_targets(session: Session, states: Optional[List[str]] = None) -> int:
    """
    Deletes targets from the database.
    If states is provided, deletes all targets in those states.
    If states is None or empty, deletes all targets.
    Returns the number of rows deleted.
    """
    from sqlmodel import delete
    statement = delete(Target)
    if states:
        statement = statement.where(Target.state.in_(states))
    
    result = session.exec(statement)
    session.commit()
    return result.rowcount
