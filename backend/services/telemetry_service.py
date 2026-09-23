"""System telemetry — probes Ollama, ChromaDB, and OS metrics."""

import logging
import time

import psutil
import requests

from backend.config import BackendConfig
from backend.schemas import SystemTelemetryOut

logger = logging.getLogger(__name__)

_start_time = time.time()


def get_telemetry(config: BackendConfig) -> SystemTelemetryOut:
    from backend.services.qa_service import get_avg_latency_ms
    
    # Probe Ollama
    ollama_status = "offline"
    ollama_model = config.ollama_model or "unknown"
    try:
        resp = requests.get(f"{config.ollama_base_url}/api/tags", timeout=3)
        if resp.status_code == 200:
            ollama_status = "online"
            models = resp.json().get("models", [])
            if models:
                ollama_model = models[0].get("name", ollama_model)
    except Exception:
        pass
    
    # Probe ChromaDB
    chroma_status = "disconnected"
    total_vectors = 0
    try:
        from rag.config import RagConfig
        from rag.vectorstore.chroma_store import ChromaVectorStore
        
        rag_cfg = RagConfig.from_env()
        store = ChromaVectorStore(rag_cfg.vector_db_dir, rag_cfg.collection_name)
        total_vectors = store.collection.count()
        chroma_status = "connected"
    except Exception as e:
        logger.debug(f"ChromaDB probe failed: {e}")
    
    return SystemTelemetryOut(
        ollama_status=ollama_status,
        ollama_model=ollama_model,
        chroma_status=chroma_status,
        total_vectors=total_vectors,
        memory_usage_pct=round(psutil.virtual_memory().percent, 1),
        cpu_usage_pct=round(psutil.cpu_percent(interval=0.1), 1),
        uptime_seconds=int(time.time() - _start_time),
        avg_latency_ms=round(get_avg_latency_ms(), 1),
    )
