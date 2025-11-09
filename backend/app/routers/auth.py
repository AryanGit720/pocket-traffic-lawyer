# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional

from app.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, pwd_context
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.chat_history import ChatHistory

router = APIRouter()

# Schemas
class UserPublic(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email_or_username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 0  # seconds until access token expiry
    user: UserPublic

class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    password: Optional[str] = Field(default=None, min_length=8)

class ChatHistoryItem(BaseModel):
    id: int
    question: str
    answer: str
    sources: Optional[list[dict]] = None
    confidence: Optional[float] = None
    is_bookmarked: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Helpers
def _issue_tokens(db: Session, user: User, user_agent: str = "", ip: str = "") -> TokenResponse:
    access = create_access_token(user.id)
    refresh_plain = create_refresh_token()
    refresh_hashed = pwd_context.hash(refresh_plain)
    rt = RefreshToken(user_id=user.id, token_hash=refresh_hashed)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh_plain,
        expires_in=30 * 60,  # 30 minutes
        user=user,
    )

# Routes
@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_tokens(db, user, request.headers.get("user-agent", ""), request.client.host if request.client else "")

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == payload.email_or_username) | (User.username == payload.email_or_username)
    ).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return _issue_tokens(db, user, request.headers.get("user-agent", ""), request.client.host if request.client else "")

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    # Validate provided refresh token by comparing hash with stored non-revoked token
    tokens: List[RefreshToken] = db.query(RefreshToken).filter(
        RefreshToken.revoked == False,  # noqa: E712
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).all()

    matched: Optional[RefreshToken] = None
    for t in tokens:
        if pwd_context.verify(payload.refresh_token, t.token_hash):
            matched = t
            break

    if not matched:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).get(matched.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Rotate: revoke old and create new
    matched.revoked = True
    db.add(matched)
    db.commit()

    return _issue_tokens(db, user, request.headers.get("user-agent", ""), request.client.host if request.client else "")

@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    tokens: List[RefreshToken] = db.query(RefreshToken).filter(
        RefreshToken.revoked == False  # noqa: E712
    ).all()
    revoked_any = False
    for t in tokens:
        if pwd_context.verify(payload.refresh_token, t.token_hash):
            t.revoked = True
            db.add(t)
            revoked_any = True
    if revoked_any:
        db.commit()
    return {"success": True}

@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserPublic)
def update_me(payload: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.email and payload.email != user.email:
        exists = db.query(User).filter(User.email == payload.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.username and payload.username != user.username:
        exists = db.query(User).filter(User.username == payload.username).first()
        if exists:
            raise HTTPException(status_code=400, detail="Username already in use")
        user.username = payload.username
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/history", response_model=List[ChatHistoryItem])
def get_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.query(ChatHistory).filter(ChatHistory.user_id == user.id).order_by(ChatHistory.created_at.desc()).all()
    return items

@router.delete("/history/{item_id}")
def delete_history(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(ChatHistory).filter(ChatHistory.id == item_id, ChatHistory.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"success": True}

class BookmarkRequest(BaseModel):
    is_bookmarked: bool

@router.post("/history/{item_id}/bookmark")
def bookmark_history(item_id: int, payload: BookmarkRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(ChatHistory).filter(ChatHistory.id == item_id, ChatHistory.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_bookmarked = payload.is_bookmarked
    db.add(item)
    db.commit()
    return {"success": True, "is_bookmarked": item.is_bookmarked}