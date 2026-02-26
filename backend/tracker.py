import hashlib
import httpx
import asyncio
from typing import List
from sqlmodel import Session, select
from datetime import datetime, timezone

from .database import engine
from .models import Target
from .crud import record_target_check

async def check_url(target: Target):
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        try:
            response = await client.get(target.url)
            content = response.text
            content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
            return target.id, response.status_code, content_hash, None
        except Exception as e:
            print(f"Error checking {target.url}: {e}")
            return target.id, 0, None, str(e)

async def check_all_targets_inner():
    with Session(engine) as session:
        statement = select(Target).where(Target.status != "paused")
        targets = session.exec(statement).all()
    
    if not targets:
        return 0
    
    tasks = [check_url(t) for t in targets]
    results = await asyncio.gather(*tasks)
    
    updated_count = 0
    with Session(engine) as session:
        for target_id, status_code, content_hash, error_msg in results:
            record_target_check(
                session=session,
                target_id=target_id,
                http_status=status_code,
                content_hash=content_hash,
                error_msg=error_msg
            )
            updated_count += 1
            
    return updated_count

def check_all_targets():
    """Synchronous wrapper for async tracking logic"""
    return asyncio.run(check_all_targets_inner())

if __name__ == "__main__":
    count = check_all_targets()
    print(f"Checked {count} targets.")
