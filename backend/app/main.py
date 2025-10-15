# backend/app/main.py
from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import os

# Зареждаме .env независимо къде стартираме uvicorn
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

# -------- Lifespan (startup/shutdown) --------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Стартиране (startup):
      1) По желание: seed-ване на каталога (ако SEED_EMBEDDED=true)
      2) Build на индекси (tag + semantic)
      3) Опит за кеш/зареждане на рейтинги

    Спиране (shutdown): нищо специално към момента.
    """
    # Импортите са вътре, за да избегнем циклични зависимости при стартиране
    try:
        from app.routers.tool_router import (
            build_tool_index,
            build_semantic_index,
            _fetch_ratings,
        )
        from app.db.database import SessionLocal
    except Exception as e:
        print(f"[lifespan] WARN: imports failed during startup: {e}")
        # Дори и да има проблем с тези импорти, не блокираме сървъра.
        # Все пак yield-ваме, за да може приложението да тръгне.
        yield
        return

    # 1) Автоматично seed-ване ако е включено
    seed_enabled = os.getenv("SEED_EMBEDDED", "false").lower() == "true"
    if seed_enabled:
        try:
            from app.seed_tools import seed_embedded_catalog
            print("[startup] Running automatic seed...")
            seed_embedded_catalog()
            print("[startup] Seed completed successfully")
        except Exception as e:
            print(f"[startup] WARN: auto-seed failed: {e}")

    # 2) Индекси и warmup
    try:
        db = SessionLocal()
        try:
            build_tool_index(db)
            build_semantic_index(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[startup] WARN: failed to build indexes early: {e}")

    # 3) Рейтинги (опционално)
    try:
        _fetch_ratings(force=False)
    except Exception as e:
        print(f"[startup] WARN: ratings warmup failed: {e}")

    # Продължаваме към нормалния живот на приложението
    yield

    # --- Shutdown (ако има нужда в бъдеще) ---
    # Тук можеш да затваряш ресурси, връзки и т.н.


# Създаваме приложението с lifespan
app = FastAPI(
    title="My AI",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# -------- CORS конфигурация (чете от .env) --------
_raw = os.getenv("CORS_ALLOW_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]
ALLOW_ORIGIN_REGEX = os.getenv("CORS_ALLOW_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or [],      # празен списък е ОК, ако имаме regex
    allow_origin_regex=ALLOW_ORIGIN_REGEX,    # напр. ^https?://(localhost|127\.0\.0\.1)(:\d+)?$
    allow_credentials=True,                   # позволяваме httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-XSRF-TOKEN", "*"],
    max_age=86400,
)

# Универсален preflight → 204; CORSMiddleware добавя нужните CORS хедъри
@app.options("/{rest_of_path:path}")
async def any_preflight(rest_of_path: str, request: Request):
    return Response(status_code=204)

# -------- Роутери (зареждаме след CORS, избягваме цикличен импорт) --------
from app.routers.auth_router import router as auth_router  # noqa: E402
from app.routers.tool_router import router as tool_router  # noqa: E402

try:
    from app.routers.catalog_router import router as catalog_router  # noqa: E402
except Exception:
    catalog_router = None

app.include_router(auth_router)
app.include_router(tool_router)
if catalog_router:
    app.include_router(catalog_router)


@app.get("/")
def root():
    return {"ok": True}
