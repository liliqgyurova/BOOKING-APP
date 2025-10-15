from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from urllib.parse import urlparse

from app.db.database import get_db
from app.models.tool import AITool
from app.models.translation import ToolTranslation  # 🆕 НОВ ИМПОРТ

router = APIRouter(prefix="/catalog", tags=["catalog"])

# ---------- Официални cap:* "категории" ----------
CAP_LIST = [
    "cap:research-web",
    "cap:text-explain",
    "cap:text-summarize",
    "cap:text-edit",
    "cap:slide-generate",
    "cap:image-generate",
    "cap:image-edit",
    "cap:video-generate",
    "cap:video-edit",
    "cap:audio-transcribe",
    "cap:voice-generate",
    "cap:automate-workflow",
    "cap:integrations",
    "cap:doc-read-pdf",
    # по-долу са домейн-специфични; остават по желание
    "cap:dicom-view",
    "cap:dicom-store",
    "cap:dicom-deid",
    "cap:med-seg",
    "cap:report-summarize",
]

CAP_DISPLAY = {
    "cap:research-web": "Изследване / търсене",
    "cap:text-explain": "Обяснения / текстов асистент",
    "cap:text-summarize": "Резюме / извличане",
    "cap:text-edit": "Редакция и пренаписване",
    "cap:slide-generate": "Презентации",
    "cap:image-generate": "Генериране на изображения",
    "cap:image-edit": "Редакция на изображения",
    "cap:video-generate": "Създаване на видео",
    "cap:video-edit": "Редакция на видео",
    "cap:audio-transcribe": "Транскрипция на аудио/срещи",
    "cap:voice-generate": "Синтез/генерация на глас",
    "cap:automate-workflow": "Автоматизация",
    "cap:integrations": "Интеграции",
    "cap:doc-read-pdf": "Четене/анализ на PDF",
    "cap:dicom-view": "Преглед на DICOM",
    "cap:dicom-store": "DICOM сървър",
    "cap:dicom-deid": "Анонимизация на DICOM",
    "cap:med-seg": "Медицинска сегментация",
    "cap:report-summarize": "Резюме на радиологичен репорт",
}

# ---------- Помощни ----------
def _favicon_from_website(website: Optional[str], size: int = 64) -> Optional[str]:
    if not website:
        return None
    domain = urlparse(website).netloc or website
    return f"https://www.google.com/s2/favicons?domain={domain}&sz={size}"

def _tool_icon(t: AITool) -> Optional[str]:
    icon_db = getattr(t, "icon_url", None)
    if icon_db:
        return icon_db
    website = None
    links = getattr(t, "links", None)
    if isinstance(links, dict):
        website = links.get("website")
    return _favicon_from_website(website)

def _tool_out(t: AITool, language: str = "bg", db: Session = None) -> Dict:
    """
    🆕 ОБНОВЕНА ФУНКЦИЯ - използва таблицата tool_translations
    """
    links = t.links if isinstance(t.links, dict) else {}
    rating = getattr(t, "rating", None)
    
    # Вземи превода за description от базата
    description = t.description or ""  # Fallback
    
    if db:
        trans = db.query(ToolTranslation).filter(
            ToolTranslation.tool_id == t.id,
            ToolTranslation.language == language,
            ToolTranslation.field == "description"
        ).first()
        
        if trans:
            description = trans.value
        elif language != "bg":
            # Fallback към български ако няма превод
            trans_bg = db.query(ToolTranslation).filter(
                ToolTranslation.tool_id == t.id,
                ToolTranslation.language == "bg",
                ToolTranslation.field == "description"
            ).first()
            if trans_bg:
                description = trans_bg.value
    
    return {
        "name": t.name,
        "link": links.get("website"),
        "icon": _tool_icon(t),
        "rating": float(rating) if rating is not None else None,
        "tags": t.tags or [],
        "description": description,
    }

# ---------- /catalog/tools ----------
@router.get("/tools")
def list_tools(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(default=None, description="Търсене по име (ILIKE)"),
    tag: Optional[str] = Query(default=None, description="Свободен таг"),
    cap: Optional[str] = Query(default=None, description="cap:* категория"),
    language: str = Query(default="bg", regex="^(en|bg)$", description="Език: en или bg"),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="rating", regex="^(rating|name)$"),
):
    query = db.query(AITool)

    if q:
        like = f"%{q}%"
        query = query.filter(AITool.name.ilike(like))

    if tag:
        query = query.filter(AITool.tags.any(tag))

    if cap:
        query = query.filter(AITool.tags.any(cap))

    if sort == "rating":
        query = query.order_by(AITool.rating.desc().nullslast(), AITool.name.asc())
    else:
        query = query.order_by(AITool.name.asc())

    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    # 🆕 ПРОМЕНЕН РЕД - предаваме db към _tool_out
    return {"total": total, "items": [_tool_out(t, language, db) for t in items], "limit": limit, "offset": offset}

# ---------- /catalog/categories ----------
@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    out = []
    for cap in CAP_LIST:
        cnt = db.query(func.count(AITool.id)).filter(AITool.tags.any(cap)).scalar()
        out.append({
            "id": cap,
            "label": CAP_DISPLAY.get(cap, cap),
            "count": int(cnt or 0),
        })
    return {"categories": out}