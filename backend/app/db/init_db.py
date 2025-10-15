from sqlalchemy import text
from app.db.database import engine

def ensure_schema():
    # добавя колоната, ако я няма
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE ai_tools "
            "ADD COLUMN IF NOT EXISTS icon_url VARCHAR"
        ))
        conn.commit()
