from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    password_hash = Column(String(255), nullable=True)

    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")

class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_user_id", name="uq_provider_userid"),)

    id = Column(Integer, primary_key=True)
    provider = Column(String, index=True)  # google | facebook | apple
    provider_user_id = Column(String, index=True)
    email = Column(String, nullable=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)

    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(Integer, nullable=True)  # epoch seconds (опционално)
    raw = Column(JSON, nullable=True)  # суров отговор от провайдъра (по желание)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="oauth_accounts")
