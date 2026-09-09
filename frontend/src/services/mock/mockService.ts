import type {
  User,
  Document,
  Citation,
  Conversation,
  DashboardStats,
  SystemTelemetry,
  AuditLog,
  AuthResponse,
  QAResponse,
} from "@/lib/types";

export const mockDelay = (ms: number = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_ADMIN_USER: User = {
  id: "usr_admin",
  email: "admin@aegis.local",
  name: "AEGIS Administrator",
  role: "admin",
  status: "active",
  department: "Enterprise Systems & Governance",
  documents_count: 14,
  last_login: "Just now",
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const MOCK_OPERATOR_USER: User = {
  id: "usr_operator",
  email: "user@aegis.local",
  name: "Elena Vance (Engineer)",
  role: "user",
  status: "active",
  department: "Field Engineering",
  documents_count: 5,
  last_login: "15 mins ago",
  created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
};

export let MOCK_USERS_LIST: User[] = [
  MOCK_ADMIN_USER,
  MOCK_OPERATOR_USER,
  {
    id: "usr_003",
    email: "david.ross@aegis.local",
    name: "David Ross",
    role: "user",
    status: "active",
    department: "Safety & Compliance",
    documents_count: 8,
    last_login: "2 hours ago",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "usr_004",
    email: "sarah.connor@aegis.local",
    name: "Sarah Connor",
    role: "viewer",
    status: "active",
    department: "Quality Audit",
    documents_count: 2,
    last_login: "Yesterday",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

export let MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc_001",
    owner_id: "usr_admin",
    filename: "P-102 Technical Manual.pdf",
    status: "ready",
    pages: 48,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "doc_002",
    owner_id: "usr_operator",
    filename: "Centrifugal Pump Operating Tolerances.pdf",
    status: "ready",
    pages: 22,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "doc_003",
    owner_id: "usr_admin",
    filename: "Plant Safety & Hazardous Materials Protocol.pdf",
    status: "ready",
    pages: 86,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "doc_004",
    owner_id: "usr_operator",
    filename: "Electrical Substation Maintenance Guide.docx",
    status: "ready",
    pages: 34,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "doc_005",
    owner_id: "usr_operator",
    filename: "Valve Inspection Checklist Q1.txt",
    status: "ready",
    pages: 5,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_001",
    title: "P-102 Discharge Pressure Analysis",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: "msg_001",
        role: "user",
        content: "What is the normal operating discharge pressure of pump P-102?",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg_002",
        role: "assistant",
        content:
          "Based on the **P-102 Technical Manual** (Section 3.2), the normal operating discharge pressure is **3.5 to 4.2 bar (50.8 – 60.9 PSI)** at standard ambient temperatures (15°C – 35°C).\n\nIf the discharge pressure exceeds 4.5 bar, the high-pressure interlock trip triggers automatically to prevent mechanical seal degradation.",
        citations: [
          {
            document_id: "doc_001",
            document_name: "P-102 Technical Manual.pdf",
            page: 14,
            section: "Section 3.2: Pressure Envelope & Operating Parameters",
            chunk_id: "chk_p102_032",
            snippet:
              "Normal operating discharge pressure for unit P-102 shall remain bounded between 3.5 bar and 4.2 bar (50.8 to 60.9 PSI). Continuous monitoring is enforced via transducer PT-102A.",
          },
          {
            document_id: "doc_002",
            document_name: "Centrifugal Pump Operating Tolerances.pdf",
            page: 7,
            section: "Section 1.4: High-Pressure Protective Interlocks",
            chunk_id: "chk_tol_014",
            snippet:
              "High-pressure trip threshold: 4.5 bar gauge. Emergency relief valve RV-102 cracks at 4.8 bar to protect upstream pipe flanges.",
          },
        ],
        created_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
      },
    ],
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log_001",
    actor: "AEGIS Administrator",
    actor_email: "admin@aegis.local",
    action: "DOCUMENT_INGEST",
    target: "P-102 Technical Manual.pdf",
    details: "Ingested 48 pages, generated 142 semantic vector chunks.",
    ip_address: "127.0.0.1",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: "success",
  },
  {
    id: "log_002",
    actor: "Elena Vance",
    actor_email: "user@aegis.local",
    action: "QA_QUERY",
    target: "P-102 Operating Parameters",
    details: "Retrieved 2 verified citations from Chroma vector store.",
    ip_address: "192.168.1.45",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "success",
  },
  {
    id: "log_003",
    actor: "David Ross",
    actor_email: "david.ross@aegis.local",
    action: "DOCUMENT_VIEW",
    target: "Plant Safety Protocol.pdf",
    details: "Accessed safety compliance section.",
    ip_address: "192.168.1.52",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: "success",
  },
];

export const mockAuthService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await mockDelay(400);
    if (!email || !password) throw new Error("Invalid email or password");
    const isAdmin = email.toLowerCase().includes("admin");
    const user: User = isAdmin
      ? MOCK_ADMIN_USER
      : {
          ...MOCK_OPERATOR_USER,
          email: email.toLowerCase(),
          name: email.includes("user")
            ? MOCK_OPERATOR_USER.name
            : email.split("@")[0].replace(".", " "),
        };

    return {
      access_token: "mock_jwt_" + (isAdmin ? "admin_" : "user_") + Date.now(),
      token_type: "bearer",
      user,
    };
  },

  async getCurrentUser(): Promise<User> {
    await mockDelay(150);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aegis_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return MOCK_ADMIN_USER;
  },

  async logout(): Promise<void> {
    await mockDelay(150);
  },
};

export const mockDashboardService = {
  async getStats(): Promise<{ stats: DashboardStats; recent_documents: Document[] }> {
    await mockDelay(300);
    return {
      stats: {
        documents_count: MOCK_DOCUMENTS.length,
        questions_asked: 84,
        agent_status: "online",
      },
      recent_documents: MOCK_DOCUMENTS.slice(0, 5),
    };
  },

  async getTelemetry(): Promise<SystemTelemetry> {
    await mockDelay(250);
    return {
      ollama_status: "online",
      ollama_model: "qwen2.5:7b-instruct",
      chroma_status: "connected",
      total_vectors: 432,
      memory_usage_pct: 38.4,
      cpu_usage_pct: 12.1,
      uptime_seconds: 48290,
      avg_latency_ms: 240,
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    await mockDelay(250);
    return [...MOCK_AUDIT_LOGS];
  },
};

export const mockDocumentService = {
  async list(): Promise<Document[]> {
    await mockDelay(300);
    return [...MOCK_DOCUMENTS];
  },

  async get(id: string): Promise<Document> {
    await mockDelay(200);
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");
    return doc;
  },

  async upload(file: File): Promise<Document> {
    await mockDelay(600);
    const newDoc: Document = {
      id: "doc_" + Date.now(),
      owner_id: "usr_admin",
      filename: file.name,
      status: "ready",
      pages: Math.max(1, Math.floor(file.size / 15000)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_DOCUMENTS.unshift(newDoc);
    MOCK_AUDIT_LOGS.unshift({
      id: "log_" + Date.now(),
      actor: "AEGIS Administrator",
      actor_email: "admin@aegis.local",
      action: "DOCUMENT_UPLOAD",
      target: file.name,
      details: `Uploaded and indexed ${newDoc.pages} pages.`,
      ip_address: "127.0.0.1",
      timestamp: new Date().toISOString(),
      status: "success",
    });
    return newDoc;
  },

  async delete(id: string): Promise<void> {
    await mockDelay(300);
    const target = MOCK_DOCUMENTS.find((d) => d.id === id);
    MOCK_DOCUMENTS = MOCK_DOCUMENTS.filter((d) => d.id !== id);
    if (target) {
      MOCK_AUDIT_LOGS.unshift({
        id: "log_" + Date.now(),
        actor: "AEGIS Administrator",
        actor_email: "admin@aegis.local",
        action: "DOCUMENT_DELETE",
        target: target.filename,
        details: "Removed document and vectors from Chroma store.",
        ip_address: "127.0.0.1",
        timestamp: new Date().toISOString(),
        status: "warning",
      });
    }
  },
};

export const mockQAService = {
  async listConversations(): Promise<Conversation[]> {
    await mockDelay(250);
    return [...MOCK_CONVERSATIONS];
  },

  async getConversation(id: string): Promise<Conversation> {
    await mockDelay(200);
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
    if (!conv) throw new Error("Conversation not found");
    return conv;
  },

  async ask(question: string, conversationId?: string): Promise<QAResponse> {
    await mockDelay(700);

    const citations: Citation[] = [
      {
        document_id: "doc_001",
        document_name: "P-102 Technical Manual.pdf",
        page: 14,
        section: "Section 3.2: Pressure Envelope & Operating Parameters",
        chunk_id: "chk_p102_032",
        snippet:
          "Normal operating discharge pressure for unit P-102 shall remain bounded between 3.5 bar and 4.2 bar (50.8 to 60.9 PSI). Continuous monitoring is enforced via transducer PT-102A.",
      },
      {
        document_id: "doc_002",
        document_name: "Centrifugal Pump Operating Tolerances.pdf",
        page: 7,
        section: "Section 1.4: High-Pressure Protective Interlocks",
        chunk_id: "chk_tol_014",
        snippet:
          "High-pressure trip threshold: 4.5 bar gauge. Emergency relief valve RV-102 cracks at 4.8 bar to protect upstream pipe flanges.",
      },
    ];

    const answer = `According to the available engineering documentation, here are the findings regarding "${question}":\n\n- **Target Parameter:** The normal operating range is **3.5 to 4.2 bar (50.8 – 60.9 PSI)** at standard temperature.\n- **Safety Trip Envelope:** Protective interlocks activate if pressure exceeds **4.5 bar**.\n- **Verification Source:** Documented in *P-102 Technical Manual*, Section 3.2, and confirmed in *Centrifugal Pump Operating Tolerances*.`;

    const convId = conversationId || "conv_" + Date.now();
    let conv = MOCK_CONVERSATIONS.find((c) => c.id === convId);

    if (!conv) {
      conv = {
        id: convId,
        title: question.slice(0, 38) + (question.length > 38 ? "..." : ""),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
      MOCK_CONVERSATIONS.unshift(conv);
    }

    conv.messages.push({
      id: "msg_user_" + Date.now(),
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    });

    conv.messages.push({
      id: "msg_assistant_" + Date.now(),
      role: "assistant",
      content: answer,
      citations,
      created_at: new Date().toISOString(),
    });

    conv.updated_at = new Date().toISOString();

    return {
      answer,
      citations,
      conversation_id: convId,
    };
  },
};

export const mockUserService = {
  async list(): Promise<User[]> {
    await mockDelay(250);
    return [...MOCK_USERS_LIST];
  },

  async create(data: Partial<User>): Promise<User> {
    await mockDelay(300);
    const newUser: User = {
      id: "usr_" + Date.now(),
      email: data.email || "user@aegis.local",
      name: data.name || "New User",
      role: data.role || "user",
      status: "active",
      department: data.department || "Operations",
      documents_count: 0,
      last_login: "Never",
      created_at: new Date().toISOString(),
    };
    MOCK_USERS_LIST.push(newUser);
    return newUser;
  },

  async updateRole(id: string, role: "admin" | "user" | "viewer"): Promise<User> {
    await mockDelay(200);
    const user = MOCK_USERS_LIST.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.role = role;
    return user;
  },

  async updateStatus(id: string, status: "active" | "suspended"): Promise<User> {
    await mockDelay(200);
    const user = MOCK_USERS_LIST.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.status = status;
    return user;
  },

  async toggleStatus(id: string): Promise<User> {
    await mockDelay(200);
    const user = MOCK_USERS_LIST.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.status = user.status === "suspended" ? "active" : "suspended";
    return user;
  },

  async delete(id: string): Promise<void> {
    await mockDelay(200);
    MOCK_USERS_LIST = MOCK_USERS_LIST.filter((u) => u.id !== id);
  },
};

