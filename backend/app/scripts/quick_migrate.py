# backend/app/scripts/quick_migrate.py
from sqlalchemy import inspect, text
from app.db.database import engine, Base  # Base = за create_all при празна БД
# регистрирай моделите преди create_all (safe при повторно изпълнение)
from app.models.user import User, OAuthAccount  # noqa: F401

def _column_names(conn, table: str) -> set[str]:
    insp = inspect(conn)
    try:
        return {c["name"] for c in insp.get_columns(table)}
    except Exception:
        return set()

def main():
    # ако таблиците липсват, създай ги (няма да променя съществуващи)
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        backend = engine.url.get_backend_name()
        cols = _column_names(conn, "users")
        stmts: list[str] = []

        # добавяме само ако липсват (SQLite поддържа ADD COLUMN без NOT NULL/DEFAULT)
        if "password_hash" not in cols:
            stmts.append("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
        if "created_at" not in cols:
            if backend.startswith("sqlite"):
                stmts.append("ALTER TABLE users ADD COLUMN created_at TIMESTAMP")
            else:
                stmts.append("ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ")

        for s in stmts:
            conn.execute(text(s))

        print("DB backend:", engine.url)
        print("Applied:", stmts or ["nothing to do"])
        print("Users columns now:", sorted(_column_names(conn, "users")))

if __name__ == "__main__":
    main()
