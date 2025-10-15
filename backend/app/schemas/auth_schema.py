from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None

    class Config:
        from_attributes = True

class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AuthResponse(BaseModel):
    user: UserOut
    tokens: Tokens

class ProvidersOut(BaseModel):
    google: bool
    facebook: bool
    apple: bool

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str