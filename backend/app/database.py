# backend/app/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.config import settings
import logging
import secrets

logger = logging.getLogger(__name__)

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

# Enable FK enforcement in SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models so tables are registered
    from app.models.user import User
    from app.models.chat_history import ChatHistory
    from app.models.refresh_token import RefreshToken
    from app.core.security import get_password_hash

    Base.metadata.create_all(bind=engine)

    # Seed default admin if not exists
    with SessionLocal() as db:
        admin = db.query(User).filter(
            (User.email == settings.ADMIN_EMAIL) | (User.username == settings.ADMIN_USERNAME)
        ).first()
        if not admin:
            temp_password = settings.ADMIN_PASSWORD or secrets.token_urlsafe(16)
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_USERNAME,
                hashed_password=get_password_hash(temp_password),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.warning("Default admin created: %s", settings.ADMIN_EMAIL)
            if not settings.ADMIN_PASSWORD:
                logger.warning("Temporary admin password: %s", temp_password)