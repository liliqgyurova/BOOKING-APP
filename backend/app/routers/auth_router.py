# backend/app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from dotenv import load_dotenv
from pathlib import Path
import os, json, time, uuid, requests, secrets

# Зареждаме .env независимо от текущата директория
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

from jose import jwt as jose_jwt
from passlib.hash import bcrypt

from app.db.database import get_db
from app.models.user import User, OAuthAccount
from app.schemas.auth_schema import UserOut, Tokens, ProvidersOut

router = APIRouter(prefix="/auth", tags=["auth"])

# ===================== Конфигурация =====================
APP_JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev-secret")
APP_JWT_ISSUER = os.getenv("APP_JWT_ISSUER", "my-ai")
APP_JWT_ACCESS_MIN = int(os.getenv("APP_JWT_ACCESS_MIN", "60"))
APP_JWT_REFRESH_DAYS = int(os.getenv("APP_JWT_REFRESH_DAYS", "30"))

# Cookie настройки (в прод: SECURE=true, SAMESITE=none, DOMAIN=твоят домейн)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN") or None
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()  # 'lax' / 'strict' / 'none'
ACCESS_COOKIE_NAME = os.getenv("ACCESS_COOKIE_NAME", "access_token")
REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
XSRF_COOKIE_NAME = os.getenv("XSRF_COOKIE_NAME", "XSRF-TOKEN")
XSRF_HEADER_NAME = os.getenv("XSRF_HEADER_NAME", "X-XSRF-TOKEN")

# ===================== JWT помощни =====================
def _create_token(data: Dict[str, Any], minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        **data,
        "iss": APP_JWT_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    return jose_jwt.encode(payload, APP_JWT_SECRET, algorithm="HS256")

def create_tokens_for_user(user: User) -> Tokens:
    access = _create_token({"sub": str(user.id), "scope": "access"}, APP_JWT_ACCESS_MIN)
    refresh = _create_token({"sub": str(user.id), "scope": "refresh"}, APP_JWT_REFRESH_DAYS * 24 * 60)
    return Tokens(access_token=access, refresh_token=refresh)

def _decode_our(token: str, expected_scope: str) -> Dict[str, Any]:
    data = jose_jwt.decode(token, APP_JWT_SECRET, algorithms=["HS256"], issuer=APP_JWT_ISSUER)
    if data.get("scope") != expected_scope:
        raise HTTPException(status_code=401, detail="Invalid token scope")
    return data

# ===================== Cookies + CSRF =====================
def _set_cookie(resp: Response, name: str, value: str, max_age: int):
    resp.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
    )

def _clear_cookie(resp: Response, name: str):
    resp.delete_cookie(key=name, domain=COOKIE_DOMAIN, path="/")

def _set_auth_cookies(resp: Response, tokens: Tokens):
    _set_cookie(resp, ACCESS_COOKIE_NAME, tokens.access_token, APP_JWT_ACCESS_MIN * 60)
    _set_cookie(resp, REFRESH_COOKIE_NAME, tokens.refresh_token, APP_JWT_REFRESH_DAYS * 24 * 3600)
    # double-submit CSRF cookie (НЕ HttpOnly)
    xsrf = secrets.token_urlsafe(24)
    resp.set_cookie(
        key=XSRF_COOKIE_NAME,
        value=xsrf,
        max_age=APP_JWT_REFRESH_DAYS * 24 * 3600,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        path="/",
    )
    return xsrf

def _csrf_protect(request: Request):
    """За не-GET методи изискваме header == cookie (double-submit)."""
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        hdr = request.headers.get(XSRF_HEADER_NAME)
        cky = request.cookies.get(XSRF_COOKIE_NAME)
        if not hdr or not cky or hdr != cky:
            raise HTTPException(status_code=403, detail="CSRF token missing or invalid")

# ===================== Помощни за профили =====================
def _upsert_user_from_profile(db: Session, provider: str, profile: Dict[str, Any], tokens: Dict[str, Any]) -> User:
    """profile: {id, email, name, picture}"""
    prov_user_id = str(profile.get("id") or profile.get("sub"))
    if not prov_user_id:
        raise HTTPException(status_code=400, detail="Missing provider user id")

    email = (profile.get("email") or "").lower() or None
    name = profile.get("name") or profile.get("given_name")
    picture = profile.get("picture")

    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email or f"{provider}:{prov_user_id}@example.com", name=name, picture=picture)
        db.add(user)
        db.flush()

    acct = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.provider == provider, OAuthAccount.provider_user_id == prov_user_id)
        .first()
    )
    if not acct:
        acct = OAuthAccount(provider=provider, provider_user_id=prov_user_id, user_id=user.id)
        db.add(acct)

    acct.email = email
    acct.name = name
    acct.picture = picture
    acct.access_token = tokens.get("access_token")
    acct.refresh_token = tokens.get("refresh_token")
    acct.expires_at = tokens.get("expires_at")
    acct.raw = tokens.get("raw")

    if (not user.name) and name:
        user.name = name
    if (not user.picture) and picture:
        user.picture = picture

    db.commit()
    db.refresh(user)
    return user

# Проверка на Google ID токен чрез JWKS
def _decode_id_token_with_jwks(id_token: str, jwks: Dict[str, Any], audience: str, issuer: Optional[str] = None) -> Dict[str, Any]:
    header = jose_jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=400, detail="Missing kid in ID token header")

    rsa_key = None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = {"kty": key.get("kty"), "kid": key.get("kid"), "use": key.get("use"), "n": key.get("n"), "e": key.get("e")}
            break
    if not rsa_key:
        raise HTTPException(status_code=400, detail="Matching JWK not found")

    claims = jose_jwt.decode(
        id_token,
        rsa_key,
        algorithms=["RS256"],
        audience=audience,
        issuer=issuer,
        options={"verify_at_hash": False},
    )
    return claims

# ===================== Providers & Health =====================
@router.get("/providers", response_model=ProvidersOut)
def providers_enabled():
    return ProvidersOut(
        google=bool(os.getenv("GOOGLE_CLIENT_ID")),
        facebook=bool(os.getenv("FACEBOOK_CLIENT_ID")),
        apple=bool(os.getenv("APPLE_CLIENT_ID") and os.getenv("APPLE_PRIVATE_KEY")),
    )

@router.get("/health")
def auth_health():
    return {
        "google_client_id": bool(os.getenv("GOOGLE_CLIENT_ID")),
        "google_secret": bool(os.getenv("GOOGLE_CLIENT_SECRET")),
        "google_redirect": os.getenv("GOOGLE_REDIRECT_URI"),
        "jwt_loaded": bool(APP_JWT_SECRET),
        "cookie_secure": COOKIE_SECURE,
        "cookie_samesite": COOKIE_SAMESITE,
        "cookie_domain": COOKIE_DOMAIN,
    }

# ===================== GOOGLE OAuth =====================
GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS  = "https://www.googleapis.com/oauth2/v3/certs"

@router.get("/login/google")
def login_google(redirect: bool = Query(default=False)):
    """GET /auth/login/google?redirect=1 → 302 към Google (за popup)."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not client_id or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    state = uuid.uuid4().hex
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "include_granted_scopes": "true",
        "prompt": "select_account",
        "state": state,
    }
    auth_url = f"{GOOGLE_AUTH}?{urlencode(params)}"
    if redirect:
        return RedirectResponse(url=auth_url, status_code=302)
    return {"auth_url": auth_url, "state": state}

@router.get("/callback/google", response_class=HTMLResponse)
def callback_google(code: str, request: Request, response: Response, db: Session = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # обмен на code → tokens
    token_res = requests.post(GOOGLE_TOKEN, data={
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }, timeout=20)
    if not token_res.ok:
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_res.text}")
    token_data = token_res.json()
    id_token = token_data.get("id_token")
    access_token = token_data.get("access_token")

    jwks = requests.get(GOOGLE_JWKS, timeout=10).json()
    try:
        claims = _decode_id_token_with_jwks(id_token, jwks, audience=client_id, issuer="https://accounts.google.com")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {e}")

    profile = {
        "id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name") or f"{claims.get('given_name','')} {claims.get('family_name','')}".strip(),
        "picture": claims.get("picture"),
    }

    user = _upsert_user_from_profile(db, "google", profile, {
        "access_token": access_token,
        "raw": token_data,
        "expires_at": int(time.time()) + int(token_data.get("expires_in", 0) or 0),
    })
    tokens = create_tokens_for_user(user)

    _set_auth_cookies(response, tokens)

    payload = json.dumps({"user": UserOut.model_validate(user).model_dump(), "tokens": tokens.model_dump()})
    html = f"""
    <script>
      try {{
        if (window.opener) {{
          window.opener.postMessage({payload}, "*");
        }}
      }} catch (e) {{}}
      window.close();
      document.body.innerHTML = '<pre>{payload}</pre>';
    </script>
    """
    return HTMLResponse(content=html)

# ===================== Email / Password =====================
@router.post("/register")
def register(payload: dict, db: Session = Depends(get_db)):
    """Body: {email, password, name?} → сетва cookies и връща {user, tokens}."""
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    name = payload.get("name")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    exists = db.query(User).filter(User.email == email).first()
    if exists and exists.password_hash:
        raise HTTPException(status_code=409, detail="Email already registered")

    if not exists:
        user = User(email=email, name=name)
        db.add(user)
        db.flush()
    else:
        user = exists
        if not user.is_active:
            raise HTTPException(status_code=403, detail="User is inactive")
        if not user.name and name:
            user.name = name

    user.password_hash = bcrypt.hash(password)
    db.commit()
    db.refresh(user)

    tokens = create_tokens_for_user(user)
    resp = JSONResponse({"user": UserOut.model_validate(user).model_dump(), "tokens": tokens.model_dump()})
    _set_auth_cookies(resp, tokens)
    return resp

@router.post("/login")
def password_login(payload: dict, db: Session = Depends(get_db)):
    """Body: {email, password} → сетва cookies и връща {user, tokens}."""
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or not user.password_hash or not bcrypt.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    tokens = create_tokens_for_user(user)
    resp = JSONResponse({"user": UserOut.model_validate(user).model_dump(), "tokens": tokens.model_dump()})
    _set_auth_cookies(resp, tokens)
    return resp

# ===================== Refresh / Logout =====================
@router.post("/refresh")
def refresh(request: Request, response: Response):
    _csrf_protect(request)
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        data = _decode_our(refresh_token, expected_scope="refresh")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid refresh token: {e}")

    user_id = data.get("sub")
    new_access = _create_token({"sub": user_id, "scope": "access"}, APP_JWT_ACCESS_MIN)
    _set_cookie(response, ACCESS_COOKIE_NAME, new_access, APP_JWT_ACCESS_MIN * 60)
    return {"ok": True}

@router.post("/logout")
def logout(request: Request, response: Response):
    _csrf_protect(request)
    _clear_cookie(response, ACCESS_COOKIE_NAME)
    _clear_cookie(response, REFRESH_COOKIE_NAME)
    response.delete_cookie(key=XSRF_COOKIE_NAME, domain=COOKIE_DOMAIN, path="/")
    return {"ok": True}

# ===================== /me (GET + PATCH) =====================
def _get_current_user(db: Session, authorization: Optional[str], access_cookie: Optional[str]) -> User:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif access_cookie:
        token = access_cookie
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        data = _decode_our(token, expected_scope="access")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    user_id = int(data.get("sub"))
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=UserOut)
def me(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    request: Request = None,
):
    access_cookie = request.cookies.get(ACCESS_COOKIE_NAME) if request else None
    user = _get_current_user(db, authorization, access_cookie)
    return user

@router.patch("/me", response_model=UserOut)
def update_me(
    payload: dict,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    request: Request = None,
):
    # CSRF защита за mutating заявки
    _csrf_protect(request)

    access_cookie = request.cookies.get(ACCESS_COOKIE_NAME) if request else None
    user = _get_current_user(db, authorization, access_cookie)

    name = payload.get("name")
    picture = payload.get("picture")
    if name is not None:
        user.name = (name or "").strip() or None
    if picture is not None:
        user.picture = (picture or "").strip() or None

    db.commit()
    db.refresh(user)
    return user
