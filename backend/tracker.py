import hashlib
import httpx
import asyncio
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime, timezone

from .database import engine
from .models import Target
from .crud import record_target_check
from bs4 import BeautifulSoup
import re

def get_clean_text(html: str) -> str:
    """Extracts meaningful text from HTML while stripping dynamic noise."""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Remove script and style elements
    for element in soup(["script", "style", "nav", "footer", "head", "header", "aside"]):
        element.decompose()

    # Get text
    text = soup.get_text()
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

async def check_url(target: Target):
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            response = await client.get(target.url)
            if response.status_code == 200:
                clean_text = get_clean_text(response.text)
                content_hash = hashlib.sha256(clean_text.encode('utf-8')).hexdigest()
            else:
                content_hash = None
            return target.id, response.status_code, content_hash, None
        except Exception as e:
            print(f"Error checking {target.url}: {e}")
            return target.id, 0, None, str(e)

async def check_all_targets_inner(state: Optional[str] = None):
    with Session(engine) as session:
        statement = select(Target).where(Target.status != "paused")
        if state:
            statement = statement.where(Target.state == state)
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

def check_all_targets(state: Optional[str] = None):
    """Synchronous wrapper for async tracking logic"""
    return asyncio.run(check_all_targets_inner(state))

if __name__ == "__main__":
    count = check_all_targets()
    print(f"Checked {count} targets.")
