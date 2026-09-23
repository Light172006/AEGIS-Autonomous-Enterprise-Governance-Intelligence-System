// ─── AEGIS API Types ───

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  status?: "active" | "suspended";
  department?: string;
  documents_count?: number;
  last_login?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  actor_email: string;
  action: string;
  target: string;
  details?: string;
  ip_address: string;
  timestamp: string;
  status: "success" | "warning" | "failed";
}

export interface SystemTelemetry {
  ollama_status: "online" | "offline" | "busy";
  ollama_model: string;
  chroma_status: "connected" | "disconnected";
  total_vectors: number;
  memory_usage_pct: number;
  cpu_usage_pct: number;
  uptime_seconds: number;
  avg_latency_ms: number;
}


export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardStats {
  documents_count: number;
  questions_asked: number;
  agent_status: "online" | "offline" | "degraded";
}

export interface Document {
  id: string;
  owner_id: string;
  filename: string;
  status: "uploaded" | "processing" | "ready" | "error";
  pages: number;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  document_id: string;
  document_name: string;
  page: number;
  section: string;
  chunk_id: string;
  snippet: string;
}

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: QAMessage[];
}

export interface QARequest {
  question: string;
  conversation_id?: string;
}

export interface QAResponse {
  answer: string;
  citations: Citation[];
  conversation_id: string;
}

export interface UploadProgress {
  stage: "uploaded" | "text_extraction" | "chunking" | "embedding" | "vector_indexing" | "complete";
  progress: number;
  filename: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}
