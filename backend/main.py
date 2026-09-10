"""AEGIS Backend — FastAPI application factory."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import BackendConfig
from backend.database import init_db
from backend.routers import auth, dashboard, documents, health, qa, users

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = BackendConfig.from_env()
    logger.info("AEGIS Backend starting — initialising database…")
    init_db(config)
    logger.info("Database ready. Admin user seeded.")
    yield
    logger.info("AEGIS Backend shutting down.")


app = FastAPI(
    title="AEGIS",
    description="Sovereign On-Premise Agentic AI Workbench API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
config = BackendConfig.from_env()
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(qa.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
