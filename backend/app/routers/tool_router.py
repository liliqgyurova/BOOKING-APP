# backend/app/routers/tool_router.py
from __future__ import annotations

import os, re, json, time, threading, logging, requests
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tool import AITool
from app.schemas.tool_schema import PlanRequest, PlanResponse

# ---------- Логер ----------
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------- LLM (Groq) ----------
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY липсва – ще се ползват статични fallback стъпки.")

SUPPORTED_MODELS = [
    "llama3-70b-8192",
    "llama3-8b-8192",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
]

router = APIRouter()

# =========================================================
#                  И Н Д Е К С И  /  Е М Б Е Д И Н Г
# =========================================================
try:
    import faiss
    _HAS_FAISS = True
except Exception:
    _HAS_FAISS = False

from sentence_transformers import SentenceTransformer
from rapidfuzz import fuzz
import numpy as np

EMBED_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
_embed_model: Optional[SentenceTransformer] = None

_faiss_index = None
_emb_matrix: Optional[np.ndarray] = None
_tool_texts: List[str] = []
_tool_objs: List[AITool] = []
_index_lock = threading.Lock()

tools_by_tag: Dict[str, List[AITool]] = {}
tools_cache_lock = threading.Lock()


def _load_embed_model():
    global _embed_model
    if _embed_model is None:
        logger.info(f"🧠 Зареждам embedding модел: {EMBED_MODEL_NAME}")
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)


def _to_unit(vecs: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-12
    return vecs / norms


def build_tool_index(db: Session):
    """Индекс по тагове (cap:* и др.)."""
    global tools_by_tag
    with tools_cache_lock:
        tools_by_tag.clear()
        for t in db.query(AITool).all():
            for tag in (t.tags or []):
                k = (tag or "").lower().strip()
                if not k:
                    continue
                tools_by_tag.setdefault(k, []).append(t)
    logger.info(f"🧰 Индекс по тагове готов: {len(tools_by_tag)} ключа")


def build_semantic_index(db: Session):
    """Семантичен индекс върху (name + tags)."""
    global _faiss_index, _emb_matrix, _tool_texts, _tool_objs
    _load_embed_model()

    with _index_lock:
        _tool_texts, _tool_objs = [], []
        tools = db.query(AITool).all()
        for t in tools:
            _tool_texts.append(f"{t.name}. Tags: {', '.join(t.tags or [])}")
            _tool_objs.append(t)

        if not _tool_texts:
            _faiss_index, _emb_matrix = None, None
            return

        emb = _embed_model.encode(_tool_texts, convert_to_numpy=True, show_progress_bar=False)
        emb = _to_unit(emb).astype(np.float32)

        if _HAS_FAISS:
            _faiss_index = faiss.IndexFlatIP(emb.shape[1])
            _faiss_index.add(emb)
            _emb_matrix = None
        else:
            _faiss_index = None
            _emb_matrix = emb


def _semantic_candidates(query: str, top_k: int = 16) -> List[Tuple[AITool, float]]:
    if not _tool_texts:
        return []
    q_emb = _embed_model.encode([query], convert_to_numpy=True, show_progress_bar=False)
    q_emb = _to_unit(q_emb).astype(np.float32)
    if _faiss_index is not None:
        D, I = _faiss_index.search(q_emb, min(top_k, len(_tool_texts)))
        idxs, sims = I[0], D[0]
        out: List[Tuple[AITool, float]] = []
        for i, s in zip(idxs, sims):
            if i < 0:
                continue
            out.append((_tool_objs[i], float(s)))
        return out
    sims = (_emb_matrix @ q_emb.T).ravel()
    idxs = np.argsort(-sims)[:top_k]
    return [(_tool_objs[i], float(sims[i])) for i in idxs]


def _cap_candidates(cap: str, db: Session, per_cap: int = 16) -> List[AITool]:
    cap = (cap or "").lower().strip()
    bucket = tools_by_tag.get(cap, [])
    if bucket:
        return bucket[:per_cap]
    # fallback: fuzzy в тагове
    out: List[Tuple[AITool, int]] = []
    for t in db.query(AITool).all():
        best = max((fuzz.partial_ratio(cap, (tag or "").lower()) for tag in (t.tags or [])), default=0)
        if best >= 75:
            out.append((t, best))
    out.sort(key=lambda x: -x[1])
    return [t for (t, _) in out[:per_cap]]

# =========================================================
#              Р Е Й Т И Н Г И  /  П О П У Л Я Р Н О С Т
# =========================================================
CORE_UNIVERSAL = {"ChatGPT", "Claude", "Microsoft Copilot", "Gemini", "Perplexity", "Groq"}

POPULARITY_PRIOR: Dict[str, float] = {
    "ChatGPT": 1.00, "Claude": 0.98, "Microsoft Copilot": 0.95, "Gemini": 0.93, "Perplexity": 0.94, "Groq": 0.92,
    "Midjourney": 0.90, "DALL·E 3": 0.88, "Stable Diffusion": 0.86, "Runway": 0.87, "Descript": 0.83, "CapCut": 0.84,
    "Zapier Agents": 0.86, "n8n": 0.84, "Make.com": 0.83, "Canva AI": 0.86, "Gamma": 0.84, "Tome": 0.83,
}

DEPRIORITIZE_FOR_LEARNING = {"NotebookLM", "Chatbase", "Botsonic"}

AA_URL = "https://artificialanalysis.ai/leaderboards/models"
LIVE_RATINGS_ENABLED = os.getenv("LIVE_RATINGS_ENABLED", "true").lower() == "true"
RATINGS_TTL_SEC = int(os.getenv("RATINGS_TTL_SEC", str(60 * 60 * 6)))      # 6h
RATINGS_FAIL_RETRY_SEC = int(os.getenv("RATINGS_FAIL_RETRY_SEC", "600"))   # 10m backoff
RATINGS_TIMEOUT_SEC = float(os.getenv("RATINGS_TIMEOUT_SEC", "5"))

_RATINGS_CACHE: Dict[str, float] = {}
_RATINGS_TS: float = 0.0
_RATINGS_OK: bool = False
_RATINGS_LOCK = threading.Lock()

ALIASES = {
    "GPT-4": "ChatGPT", "GPT-4o": "ChatGPT", "GPT-4.1": "ChatGPT", "GPT-3.5": "ChatGPT",
    "Claude 3": "Claude", "Claude 3.5": "Claude", "Claude 2": "Claude",
    "Gemini Advanced": "Gemini", "Gemini 1.5": "Gemini",
    "Llama": "Groq",  # практичен alias за OSS/hosted линии
}

def _norm_name(name: str) -> str:
    return ALIASES.get((name or "").strip(), (name or "").strip())


def _parse_aa_html(html: str) -> Dict[str, float]:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, flags=re.S)
    data = None
    if m:
        try:
            data = json.loads(m.group(1))
        except Exception:
            data = None
    scores: Dict[str, float] = {}

    def add(name: str, v: float):
        n = _norm_name(name)
        if v > 1: v = v / 100.0
        scores[n] = max(scores.get(n, 0.0), float(max(0.0, min(1.0, v))))

    if data:
        dump = json.dumps(data)
        for m2 in re.finditer(r'"name"\s*:\s*"([^"]+)"[^\}]{0,400}?"score"\s*:\s*(\d+(?:\.\d+)?)', dump):
            add(m2.group(1), float(m2.group(2)))
        for m2 in re.finditer(r'"model"\s*:\s*"([^"]+)"[^\}]{0,400}?"(overall|rating|avg)"\s*:\s*(\d+(?:\.\d+)?)', dump):
            add(m2.group(1), float(m2.group(3)))
    if not scores:
        for m3 in re.finditer(r'"(model|name)"\s*:\s*"([^"]+)"[^\}]{0,200}?"(score|rating|overall)"\s*:\s*(\d+(?:\.\d+)?)', html):
            add(m3.group(2), float(m3.group(4)))
    return scores


def _should_skip_fetch(now: float, force: bool) -> bool:
    if force: return False
    if not LIVE_RATINGS_ENABLED: return True
    if _RATINGS_TS == 0.0: return False
    age = now - _RATINGS_TS
    limit = RATINGS_TTL_SEC if _RATINGS_OK else RATINGS_FAIL_RETRY_SEC
    return age < limit


def _fetch_ratings(force: bool = False) -> Dict[str, float]:
    global _RATINGS_CACHE, _RATINGS_TS, _RATINGS_OK
    with _RATINGS_LOCK:
        now = time.time()
        if _should_skip_fetch(now, force):
            return dict(_RATINGS_CACHE)

        if not LIVE_RATINGS_ENABLED:
            _RATINGS_TS, _RATINGS_OK = now, False
            return dict(_RATINGS_CACHE)

        try:
            logger.info("⬇️ Тегля live рейтинги от artificialanalysis.ai…")
            r = requests.get(AA_URL, timeout=RATINGS_TIMEOUT_SEC)
            r.raise_for_status()
            scores = _parse_aa_html(r.text)
            _RATINGS_TS = now
            if scores:
                _RATINGS_CACHE, _RATINGS_OK = scores, True
                logger.info(f"✅ Заредени {len(scores)} рейтинга")
            else:
                _RATINGS_CACHE, _RATINGS_OK = {}, False
                logger.warning("⚠️ Не успях да извлека рейтинги – ползвам fallback prior-и.")
        except Exception as e:
            _RATINGS_TS, _RATINGS_CACHE, _RATINGS_OK = now, {}, False
            logger.warning("⚠️ Не успях да извлека рейтинги – ползвам fallback prior-и. (%s)", str(e))
        return dict(_RATINGS_CACHE)


def get_all_ratings() -> Dict[str, float]:
    return _fetch_ratings(force=False)


def get_model_rating01(model: str) -> float:
    data = get_all_ratings()
    return float(data.get(_norm_name(model), 0.0))


@router.post("/ratings/refresh")
def refresh_ratings():
    data = _fetch_ratings(force=True)
    return {"ok": _RATINGS_OK, "count": len(data)}

@router.get("/ratings/health")
def ratings_health():
    now = time.time()
    age = now - _RATINGS_TS if _RATINGS_TS else None
    last = datetime.fromtimestamp(_RATINGS_TS, tz=timezone.utc).isoformat() if _RATINGS_TS else None
    return {
        "ok": _RATINGS_OK, "count": len(_RATINGS_CACHE), "last_refresh": last,
        "age_seconds": int(age) if age is not None else None,
        "source": "live" if _RATINGS_OK and _RATINGS_CACHE else "fallback",
        "enabled": LIVE_RATINGS_ENABLED,
    }

# =========================================================
#               К А П А Б И Л И Т И  /  М А П И Н Г
# =========================================================
CAP_PHRASE = {
    "cap:research-web": "Намери надеждни източници и прегледи",
    "cap:text-explain": "Обясни и отговори на въпроси",
    "cap:text-summarize": "Резюмирай статии/видеа/документи",
    "cap:doc-read-pdf": "Чети/анализирай PDF/документи",
    "cap:slide-generate": "Направи кратко обобщение/слайдове",
    "cap:image-generate": "Генерирай изображения и визуализации",
    "cap:image-edit": "Редактирай и обработи изображения",
    "cap:video-generate": "Създай/заснеми видео съдържание",
    "cap:video-edit": "Монтирай и обработи видео",
    "cap:automate-workflow": "Автоматизирай процеси и задачи",
    "cap:integrations": "Интегрирай с платформи и услуги",
}

CAPS_LEARNING_DISCOVER   = ["cap:research-web", "cap:text-explain"]
CAPS_LEARNING_MATERIALS  = ["cap:research-web", "cap:text-summarize", "cap:doc-read-pdf"]
CAPS_LEARNING_PRACTICE   = ["cap:text-explain", "cap:slide-generate"]

def _favicon_from_website(website: Optional[str], size: int = 64) -> Optional[str]:
    if not website:
        return None
    domain = urlparse(website).netloc or website
    return f"https://www.google.com/s2/favicons?domain={domain}&sz={size}"

def _tool_icon(t: AITool) -> Optional[str]:
    icon_db = getattr(t, "icon_url", None)
    if icon_db:
        return icon_db
    website = (t.links or {}).get("website")
    return _favicon_from_website(website)

# =========================================================
#                С К О Р И Н Г  /  Р Е К О М Е Н Д А Ц И И
# =========================================================
def _is_learning_query(goal: str) -> bool:
    return bool(re.search(r"\b(учи|научи|науча|обясни|какво е|what is|learn|course|курс|scrum|agile)\b", goal, flags=re.I))

def _score_tool(t: AITool, goal: str, step: str, cap: Optional[str], semantic_query: str) -> float:
    name = t.name
    live = get_model_rating01(name)  # 0..1 ако има; иначе 0
    prior = POPULARITY_PRIOR.get(name, 0.5)

    tag_bonus = 0.0
    if cap and any(cap == (tag or "").lower().strip() for tag in (t.tags or [])):
        tag_bonus = 0.06

    # евтин семантичен бонус с fuzzy (избягваме повторно embed)
    sem_sim = 0.0
    try:
        sem_sim = fuzz.partial_ratio(
            f"{semantic_query} {goal}".lower(),
            f"{t.name} {' '.join(t.tags or [])}".lower()
        ) / 100.0
    except Exception:
        pass

    score = (0.58 * max(live, prior)) + (0.27 * sem_sim) + (0.15 * tag_bonus)
    if _is_learning_query(goal) and name in DEPRIORITIZE_FOR_LEARNING:
        score -= 0.15
    return float(score)


def re_rank_tools(
    candidates: List[AITool],
    goal: str,
    step: str,
    cap: Optional[str],
    semantic_query: str,
    top_n: int = 6,
    ensure_universal_top3: bool = False,
    db: Optional[Session] = None,
) -> List[Dict]:
    uniq: Dict[str, AITool] = {t.name: t for t in candidates if t and t.name}
    scored: List[Tuple[float, AITool]] = [(_score_tool(t, goal, step, cap, semantic_query), t) for t in uniq.values()]
    scored.sort(key=lambda x: -x[0])

    out: List[Dict] = [{"name": t.name,
                        "link": (t.links or {}).get("website"),
                        "icon": _tool_icon(t)} for (_s, t) in scored[:top_n]]

    # ако трябва – гарантирано универсален в топ‑3 (без да губим алтернативи)
    if ensure_universal_top3 and not any(x["name"] in CORE_UNIVERSAL for x in out[:3]):
        for n in ["ChatGPT", "Claude", "Microsoft Copilot", "Perplexity", "Gemini", "Groq"]:
            q = db.query(AITool).filter(AITool.name == n).first() if db else None
            if q:
                uni = {"name": q.name, "link": (q.links or {}).get("website"), "icon": _tool_icon(q)}
                out = ([uni] + out)[:top_n]
                break

    # леко разнообразие: ако топ‑3 са само универсали, подсигури и 1–2 алтернативи в топ‑6
    if len([x for x in out[:3] if x["name"] in CORE_UNIVERSAL]) >= 2:
        # опитай да добавиш не‑универсални от остатъка
        extras = [x for x in out[3:] if x["name"] not in CORE_UNIVERSAL][:2]
        out = out[:4] + extras + out[4+len(extras):]
        out = out[:top_n]

    return out

# =========================================================
#             К А Н О Н И Ч Н И  С Т Ъ П К И  (LEARNING)
# =========================================================
LEARNING_CANONICAL = [
    ("Открий какво представлява темата и защо е важна", CAPS_LEARNING_DISCOVER),
    ("Намери и организирай качествени материали за обучение", CAPS_LEARNING_MATERIALS),
    ("Практикувай, обобщи и питай за обратна връзка", CAPS_LEARNING_PRACTICE),
]

def _learning_plan(goal: str, db: Session) -> Tuple[List[Dict], List[Dict]]:
    """
    Връща 3 обобщени стъпки за учене + групи за UI.
    Във всяка стъпка: гарантираме силни универсали + смислени алтернативи.
    """
    plan: List[Dict] = []
    for (task, caps) in LEARNING_CANONICAL:
        # събиране на кандидати
        candidates: List[AITool] = []
        for cap in caps:
            candidates += _cap_candidates(cap, db, per_cap=16)
        if not candidates:
            # за всеки случай – семантика по текста на стъпката
            candidates = [t for (t, _s) in _semantic_candidates(task, top_k=16)]

        cap_for_rank = caps[0] if caps else None
        tools = re_rank_tools(
            candidates=candidates,
            goal=goal,
            step=task,
            cap=cap_for_rank,
            semantic_query=task,
            top_n=6,
            ensure_universal_top3=True,
            db=db,
        )

        # свиваме до 3 за по‑чист UI
        tools = tools[:3] if len(tools) > 3 else tools
        if not tools:
            tools = [{"name": "ChatGPT", "link": "https://chat.openai.com/", "icon": None}]
        plan.append({"task": task, "tools": tools})

    groups = [{"title": item["task"], "tools": item["tools"]} for item in plan]
    return plan, groups

# =========================================================
#                 T E M P L A T E S  (други цели)
# =========================================================
TEMPLATES = [
    {
        "name": "music_video",
        "match": r"\b(музикален\s+клип|music\s+video|видеоклип|клип)\b",
        "steps": [
            ("Разработи концепция и напиши сценарий", ["cap:text-explain", "cap:image-generate"]),
            ("Организирай снимачен екип и локации", ["cap:research-web", "cap:automate-workflow"]),
            ("Заснеми видео материала", ["cap:video-generate"]),
            ("Монтирай клипа и добави ефекти", ["cap:video-edit", "cap:image-edit"]),
            ("Публикувай и промотирай", ["cap:integrations", "cap:automate-workflow"]),
        ],
    },
    {
        "name": "logo",
        "match": r"\b(лого|logo|brand)\b",
        "steps": [
            ("Изясни нуждите и стиловете", ["cap:text-explain"]),
            ("Генерирай концепции и визии", ["cap:image-generate"]),
            ("Подготви финален пакет", ["cap:image-edit","cap:slide-generate"]),
        ],
    },
    {
        "name": "pitch_deck",
        "match": r"\b(deck|pitch|презентац|инвеститор)\b",
        "steps": [
            ("Събери данни и примери", ["cap:research-web","cap:text-summarize"]),
            ("Създай структура и копирайтинг", ["cap:text-explain"]),
            ("Визуализирай слайдовете", ["cap:slide-generate","cap:image-generate"]),
        ],
    },
    {
        "name": "social_marketing",
        "match": r"\b(маркетинг|instagram|facebook|linkedin|tiktok|reels|ugc)\b",
        "steps": [
            ("Изследване на аудитория и конкуренти", ["cap:research-web","cap:text-summarize"]),
            ("Създай content план", ["cap:text-explain"]),
            ("Генерирай креативи (визии/видео)", ["cap:image-generate","cap:video-generate"]),
            ("Планирай и автоматизирай публикуване", ["cap:automate-workflow","cap:integrations"]),
        ],
    },
    {
        "name": "website_lp",
        "match": r"\b(уебсайт|сайт|landing|ленд(инг)?)\b",
        "steps": [
            ("Определи структура и съдържание", ["cap:research-web","cap:text-explain"]),
            ("Генерирай копирайтинг и изображения", ["cap:text-explain","cap:image-generate"]),
            ("Сглоби сайта с no‑code/интеграции", ["cap:automate-workflow","cap:integrations"]),
            ("Презентация/handoff", ["cap:slide-generate"]),
        ],
    },
]

def match_template(goal: str) -> Optional[Dict]:
    for tpl in TEMPLATES:
        if re.search(tpl["match"], goal, flags=re.IGNORECASE):
            return tpl
    return None

# =========================================================
#                      L L M  F A L L B A C K
# =========================================================
def _analyze_goal_context(goal: str) -> str:
    """
    Добавя допълнителен контекст въз основа на ключови думи в целта
    """
    goal_lower = goal.lower()
    
    if any(word in goal_lower for word in ["клип", "видео", "музикал", "music video"]):
        return """
Контекст: Създаване на музикален/видео клип
Фокусирай се върху: концепция, снимки, монтаж, постпродукция, публикуване
"""
    elif any(word in goal_lower for word in ["сайт", "уеб", "website", "landing"]):
        return """
Контекст: Разработка на уебсайт
Фокусирай се върху: дизайн, разработка, съдържание, оптимизация, публикуване
"""
    elif any(word in goal_lower for word in ["маркетинг", "реклама", "кампания", "промоция"]):
        return """
Контекст: Маркетинг и реклама
Фокусирай се върху: аудитория, стратегия, съдържание, канали, анализ
"""
    elif any(word in goal_lower for word in ["лого", "брандинг", "визия", "дизайн"]):
        return """
Контекст: Визуална идентичност и брандинг
Фокусирай се върху: концепция, дизайн, вариации, приложения, доставка
"""
    elif any(word in goal_lower for word in ["презентация", "pitch", "deck"]):
        return """
Контекст: Бизнес презентация
Фокусирай се върху: съдържание, структура, визуализация, подготовка, представяне
"""
    else:
        return """
Контекст: Обща задача/проект
Фокусирай се върху конкретните дейности, необходими за тази специфична цел.
"""


def _are_steps_too_generic(steps: List[str]) -> bool:
    """
    Проверява дали стъпките са твърде общи/генерични
    """
    generic_patterns = [
        "изясни", "намери", "подготви резултат", "финализирай",
        "определи изисквания", "събери информация", "подготви материали",
        "проучи", "анализирай нужди", "дефинирай цели"
    ]
    
    generic_count = 0
    for step in steps:
        step_lower = step.lower()
        if any(pattern in step_lower for pattern in generic_patterns):
            generic_count += 1
    
    # Ако повече от половината стъпки са генерични, връщаме True
    return generic_count > len(steps) / 2


def _extract_steps_from_text(content: str) -> List[str]:
    """
    Извлича стъпки от текст, ако JSON парсването се провали
    """
    steps = []
    for line in content.splitlines():
        line = re.sub(r"^[\s\-\•\d\.\)]+", "", line.strip())
        if line and not line.startswith("{") and not line.startswith("["):
            steps.append(line)
    return steps


def _get_contextual_fallback_steps(goal: str) -> List[str]:
    """
    Връща контекстуално-специфични fallback стъпки
    """
    goal_lower = goal.lower()
    
    if "музикален клип" in goal_lower or "music video" in goal_lower:
        return [
            "Разработи концепция и напиши сценарий",
            "Организирай снимачен екип и локации", 
            "Заснеми видео материала",
            "Монтирай клипа и добави визуални ефекти",
            "Публикувай и промотирай в социални медии"
        ]
    elif "уебсайт" in goal_lower or "сайт" in goal_lower:
        return [
            "Проектирай структура и потребителски поток",
            "Създай визуален дизайн и мокъпи",
            "Разработи функционалности и съдържание",
            "Тествай и оптимизирай производителността",
            "Публикувай и настрой SEO"
        ]
    elif "маркетинг" in goal_lower or "реклама" in goal_lower:
        return [
            "Изследвай и дефинирай целева аудитория",
            "Разработи контент стратегия и послания",
            "Създай визуални и текстови материали",
            "Настрой и стартирай рекламни кампании",
            "Анализирай резултати и оптимизирай"
        ]
    elif "лого" in goal_lower:
        return [
            "Проучи бранда и конкуренцията",
            "Създай концепции и скици",
            "Разработи финални варианти",
            "Тествай и усъвършенствай дизайна",
            "Подготви файлове за различни приложения"
        ]
    elif "презентация" in goal_lower or "pitch" in goal_lower:
        return [
            "Дефинирай ключови послания и структура",
            "Събери данни и подкрепящи доказателства",
            "Създай визуално съдържание и графики",
            "Оформи слайдове с професионален дизайн",
            "Подготви говорни бележки и репетирай"
        ]
    else:
        # Генеричен fallback, но по-смислен
        return [
            "Анализирай целта и дефинирай резултатите",
            "Планирай подхода и необходимите ресурси",
            "Създай основното съдържание или продукт",
            "Прегледай и подобри качеството",
            "Финализирай и достави резултата"
        ]


def _llm_steps(goal: str, model: str) -> List[str]:
    """
    Генерира контекстуално-релевантни стъпки чрез LLM
    """
    if not GROQ_API_KEY:
        return _get_contextual_fallback_steps(goal)
    
    # Анализираме целта за по-добър контекст
    goal_context = _analyze_goal_context(goal)
    
    prompt = f"""
Отговори на български език.

Потребителят иска да: "{goal}"

Генерирай списък от 3-5 ОСНОВНИ ПРАКТИЧЕСКИ стъпки за постигане на тази цел.

ВАЖНИ ПРАВИЛА:
1. Стъпките трябва да са КОНКРЕТНИ за целта, НЕ генерични
2. Всяка стъпка да описва реална дейност или фаза от процеса
3. Подреди стъпките в логична последователност - от начало до край
4. Използвай професионална терминология, подходяща за областта
5. Стъпките да са действия, които могат да се изпълнят с AI инструменти

{goal_context}

Върни САМО JSON в следния формат:
{{"steps":[{{"task":"конкретна стъпка 1"}}, {{"task":"конкретна стъпка 2"}}, ...]}}

Примери за добри стъпки:
- За музикален клип: "Разработи концепция и сценарий", "Организирай снимачен екип и локации", "Заснеми видео материал", "Монтирай и добави ефекти", "Публикувай и промотирай"
- За уебсайт: "Проектирай структура и UX", "Създай визуален дизайн", "Разработи функционалности", "Тествай и оптимизирай", "Публикувай и настрой SEO"
- За маркетинг кампания: "Анализирай целева аудитория", "Създай контент стратегия", "Произведи визуални материали", "Настрой рекламни канали", "Измери и оптимизирай резултатите"

НЕ давай общи стъпки като "Изясни изискванията", "Намери инструменти", "Подготви резултат".
"""
    
    try:
        resp = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}", 
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "Ти си експерт в планирането на проекти. Даваш конкретни, практически стъпки."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,  # По-ниска температура за по-консистентни резултати
                "max_tokens": 500,
            },
            timeout=15,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        
        # Парсване на JSON отговора
        try:
            data = json.loads(content)
            steps = [s.get("task", "").strip() for s in data.get("steps", []) if isinstance(s, dict)]
        except json.JSONDecodeError:
            # Fallback: извличане на стъпки от текст
            steps = _extract_steps_from_text(content)
        
        # Валидация - ако стъпките са твърде общи, използвай по-специфични
        if _are_steps_too_generic(steps):
            steps = _get_contextual_fallback_steps(goal)
        
        steps = [s for s in steps if s][:5]
        return steps if steps else _get_contextual_fallback_steps(goal)
        
    except Exception as e:
        logger.warning(f"LLM error: {e}")
        return _get_contextual_fallback_steps(goal)

# =========================================================
#            М А П И Н Г  К Ъ М  C A P A B I L I T Y
# =========================================================
def map_to_capability(step: str) -> Optional[str]:
    """
    По-интелигентно мапване на стъпки към capabilities
    """
    s = (step or "").lower()
    
    # Видео/Мултимедия
    if any(word in s for word in ["снимки", "заснем", "видео", "клип", "камера", "shoot", "record", "film"]):
        return "cap:video-generate"
    if any(word in s for word in ["монтаж", "монтир", "edit", "cutting", "постпродукц"]):
        return "cap:video-edit"
    
    # Дизайн и визуализация
    if any(word in s for word in ["дизайн", "визуал", "мокъп", "wireframe", "ui", "ux", "макет"]):
        return "cap:image-generate"
    if any(word in s for word in ["лого", "брандинг", "визия", "identity", "графичен"]):
        return "cap:image-generate"
    if any(word in s for word in ["концепция", "сценарий", "storyboard", "скици"]):
        return "cap:text-explain"
    
    # Съдържание и текст
    if any(word in s for word in ["напиши", "създай съдържание", "копирайт", "текст", "content"]):
        return "cap:text-explain"
    if any(word in s for word in ["обясни", "опиши", "explain", "review", "анализирай", "дефинирай"]):
        return "cap:text-explain"
    if any(word in s for word in ["summary", "summarize", "резюме", "обобщи"]):
        return "cap:text-summarize"
    
    # Изследване и данни
    if any(word in s for word in ["research", "изследвай", "търсене", "проучи", "анализ на пазара", "конкурент"]):
        return "cap:research-web"
    if any(word in s for word in ["аудитория", "таргет", "целева група", "демография"]):
        return "cap:research-web"
    
    # Документи и презентации
    if "pdf" in s or "документ" in s or "прочети" in s or "файл" in s:
        return "cap:doc-read-pdf"
    if any(word in s for word in ["slide", "deck", "презентация", "powerpoint", "слайдове"]):
        return "cap:slide-generate"
    
    # Разработка и техническа част
    if any(word in s for word in ["разработ", "програмир", "код", "develop", "функционал", "api"]):
        return "cap:automate-workflow"
    if any(word in s for word in ["тествай", "оптимизир", "debug", "performance", "seo"]):
        return "cap:automate-workflow"
    
    # Публикуване и маркетинг
    if any(word in s for word in ["публикувай", "publish", "deploy", "пусни", "качи", "upload"]):
        return "cap:integrations"
    if any(word in s for word in ["промотирай", "реклам", "маркетинг", "кампания", "social"]):
        return "cap:integrations"
    if any(word in s for word in ["автоматизир", "настрой", "integrate", "свърж"]):
        return "cap:automate-workflow"
    
    # Организация и планиране
    if any(word in s for word in ["организирай", "планирай", "график", "schedule", "екип", "ресурси"]):
        return "cap:automate-workflow"
    if any(word in s for word in ["локации", "място", "venue", "студио"]):
        return "cap:research-web"
    
    # Финанси и анализ
    if any(word in s for word in ["измери", "анализирай резултати", "метрики", "roi", "статистика"]):
        return "cap:text-summarize"
    
    # Default fallback базиран на най-честите ключови думи
    if any(word in s for word in ["създай", "генерирай", "направи", "произведи"]):
        return "cap:text-explain"  # Най-универсална capability
    
    # Ако не можем да определим - връщаме None
    return None

# =========================================================
#                           API
# =========================================================
def group_plan_items(plan: List[Dict]) -> List[Dict]:
    grouped: List[Dict] = []
    for item in plan:
        uniq = {}
        for t in item.get("tools", []):
            if t and t.get("name"):
                uniq[t["name"]] = t
        grouped.append({"title": item["task"], "tools": list(uniq.values())})
    return grouped


@router.post("/plan", response_model=PlanResponse)
def generate_plan(
    request: PlanRequest,
    db: Session = Depends(get_db),
    model: Optional[str] = Query(default=None, enum=SUPPORTED_MODELS),
):
    _ = get_all_ratings()  # неблокиращ backoff
    if not model:
        model = "llama3-70b-8192"

    # осигури индекси
    if not tools_by_tag:
        build_tool_index(db)
    if (_faiss_index is None and _emb_matrix is None):
        build_semantic_index(db)

    goal = (request.user_goal or "").strip()

    # 1) Ако е *learning* (напр. „Scrum") → 3 канонични обобщени стъпки
    if _is_learning_query(goal):
        plan, groups = _learning_plan(goal, db)
        return {"goal": goal, "plan": plan, "groups": groups}

    # 2) Иначе – опитай темплейт
    tpl = match_template(goal)
    if tpl:
        out: List[Dict] = []
        for (task, caps) in tpl["steps"]:
            candidates: List[AITool] = []
            for cap in caps:
                candidates += _cap_candidates(cap, db, per_cap=16)
            if not candidates:
                candidates = [t for (t, _s) in _semantic_candidates(task, top_k=16)]
            cap_for_rank = caps[0] if caps else None
            tools = re_rank_tools(
                candidates=candidates,
                goal=goal,
                step=task,
                cap=cap_for_rank,
                semantic_query=task,
                top_n=6,
                ensure_universal_top3=False,
                db=db,
            )
            tools = tools[:3] if len(tools) > 3 else tools
            if not tools:
                tools = [{"name": "ChatGPT", "link": "https://chat.openai.com/", "icon": None}]
            out.append({"task": task, "tools": tools})
        groups = group_plan_items(out)
        return {"goal": goal, "plan": out, "groups": groups}

    # 3) Няма темплейт → LLM макро‑стъпки (3–5), но не микро
    steps = _llm_steps(goal, model)
    plan: List[Dict] = []
    for step in steps:
        cap = map_to_capability(step)
        if cap:
            candidates = _cap_candidates(cap, db, per_cap=16)
        else:
            candidates = [t for (t, _s) in _semantic_candidates(step, top_k=16)]
        tools = re_rank_tools(
            candidates=candidates, goal=goal, step=step, cap=cap, semantic_query=step,
            top_n=6, ensure_universal_top3=False, db=db
        )
        tools = tools[:3] if len(tools) > 3 else tools
        if not tools:
            tools = [{"name": "ChatGPT", "link": "https://chat.openai.com/", "icon": None}]
        plan.append({"task": step, "tools": tools})
    groups = group_plan_items(plan)
    return {"goal": goal, "plan": plan, "groups": groups}