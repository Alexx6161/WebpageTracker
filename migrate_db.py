import sqlite3
import os

db_path = "tracker.db"

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(target)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "last_content_hash" not in columns:
            print("Adding 'last_content_hash' column to 'target' table...")
            cursor.execute("ALTER TABLE target ADD COLUMN last_content_hash TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("'last_content_hash' column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
