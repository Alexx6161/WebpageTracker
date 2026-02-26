import random
from sqlmodel import Session
from backend.database import get_session, engine, create_db_and_tables
from backend.crud import import_targets
from backend.models import ImportRequestItem

def seed():
    print("Creating DB tables...")
    create_db_and_tables()
    
    states = ["TX", "CA", "NY", "FL", "WA", "IL", "PA", "OH", "GA", "NC"]
    statuses = ["active", "paused", "error"]
    base_url = "https://example.com/property/"
    
    items = []
    print("Generating 500 mock URLs...")
    for i in range(500):
        listing_id = f"L{random.randint(100000, 999999)}_{i}"
        pid = f"PID{random.randint(100, 999)}_{i}"
        suite_id = f"S-{random.randint(100, 999)}"
        assigned_to = random.choice(["Alex Smith", "Jane Doe", "Bob Ross", "Sarah Connor", "John Wick"])
        state = random.choice(states)
        url = f"{base_url}{state}/{listing_id}"
        
        items.append(ImportRequestItem(
            state=state,
            listing_id=listing_id,
            pid=pid,
            suite_id=suite_id,
            assigned_to=assigned_to,
            url=url
        ))
        
    print(f"Importing {len(items)} items...")
    with Session(engine) as session:
        result = import_targets(
            session=session, 
            items=items,
            defaults={
                "status": random.choice(statuses),
                "change_count_total": random.randint(0, 50)
            }
        )
        print("Import Result:", result)

if __name__ == "__main__":
    seed()
