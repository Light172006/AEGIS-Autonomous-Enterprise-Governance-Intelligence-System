"""Database setup for the AEGIS backend."""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from backend.config import BackendConfig

# Late initialized engine
engine = None
SessionLocal = None
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Database not initialized")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(config: BackendConfig):
    global engine, SessionLocal
    engine = create_engine(config.database_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    import backend.models as models
    from backend.security import hash_password
    
    Base.metadata.create_all(bind=engine)
    
    os.makedirs(config.upload_dir, exist_ok=True)
    
    with SessionLocal() as db:
        admin_user = db.query(models.User).filter(models.User.email == config.admin_email).first()
        if not admin_user:
            admin_user = models.User(
                email=config.admin_email,
                name="AEGIS Administrator",
                role="admin",
                status="active",
                department="Enterprise Systems & Governance",
                hashed_password=hash_password(config.admin_password)
            )
            db.add(admin_user)
            db.commit()
