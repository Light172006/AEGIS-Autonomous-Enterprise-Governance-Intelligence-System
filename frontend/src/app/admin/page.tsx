"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  Button,
  Tag,
  Modal,
  Timeline,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileText,
  Upload,
  Trash2,
  Users,
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  Activity,
  Cpu,
  Database,
} from "lucide-react";
import { documentsApi, systemApi } from "@/lib/api";
import { UploadZone } from "@/components/upload-zone";
import type { Document, AuditLog, SystemTelemetry } from "@/lib/types";

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Filters
  const [showUpload, setShowUpload] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [docs, logs, telem] = await Promise.all([
        documentsApi.list(),
        systemApi.getAuditLogs(),
        systemApi.getTelemetry(),
      ]);
      setDocuments(docs);
      setAuditLogs(logs);
      setTelemetry(telem);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await documentsApi.delete(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      const updatedLogs = await systemApi.getAuditLogs();
      setAuditLogs(updatedLogs);
      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadComplete = async () => {
    setShowUpload(false);
    const updatedDocs = await documentsApi.list();
    setDocuments(updatedDocs);
    const updatedLogs = await systemApi.getAuditLogs();
    setAuditLogs(updatedLogs);
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnsType<Document> = [
    {
      title: "Document Name",
      dataIndex: "filename",
      key: "filename",
      render: (filename: string, record: Document) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E5E1D8] text-[#785233] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#1F1D1A] truncate max-w-[280px]">
              {filename}
            </p>
            <p className="text-[11px] text-[#6B655D]">
              Owner: {record.owner_id === "usr_admin" ? "Administrator" : "Team Member"}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Document["status"]) => (
        <Tag
          color={
            status === "ready"
              ? "success"
              : status === "processing"
              ? "processing"
              : "error"
          }
          className="!rounded-md capitalize text-[11px] font-medium"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Pages",
      dataIndex: "pages",
      key: "pages",
      render: (pages: number) => (
        <span className="text-xs text-[#1F1D1A] font-medium">{pages} p.</span>
      ),
    },
    {
      title: "Date Ingested",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at: string) => (
        <span className="text-xs text-[#6B655D]">
          {new Date(created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_: unknown, record: Document) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 className="w-3.5 h-3.5 text-[#991B1B]" />}
          onClick={() => setDocToDelete(record)}
          title="Delete document and vector index"
        />
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-[#1F1D1A]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7F5F0] text-[#785233] border border-[#E5E1D8] uppercase tracking-wider">
              Administrator
            </span>
            <span className="text-[#968F85] text-xs">•</span>
            <span className="text-xs text-[#6B655D]">Enterprise Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1D1A]">
            System Governance & Control
          </h1>
          <p className="text-xs text-[#6B655D] mt-0.5">
            Manage indexed enterprise documentation, vector pipelines, and compliance audit logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            onClick={loadAdminData}
            className="!border-[#D4CEC3] !text-[#1F1D1A]"
            title="Refresh State"
          />

          <Link href="/admin/users">
            <Button
              icon={<Users className="w-3.5 h-3.5 text-[#785233]" />}
              className="flex items-center gap-1.5 !border-[#D4CEC3] !text-[#1F1D1A] font-medium text-xs"
            >
              Manage Users
            </Button>
          </Link>

          <Button
            type="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 !bg-[#785233] hover:!bg-[#634329] font-medium text-xs"
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Indexed Documents</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">{documents.length}</span>
            <p className="text-[11px] text-[#6B655D] mt-0.5">
              {documents.reduce((acc, d) => acc + d.pages, 0)} total pages in ChromaDB
            </p>
          </div>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Vector Chunks</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">{telemetry?.total_vectors ?? 384}</span>
            <p className="text-[11px] text-[#6B655D] mt-0.5">Cosine similarity embeddings</p>
          </div>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Local Orchestrator</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#166534]">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#166534]">{telemetry?.avg_latency_ms ?? 24}</span>
            <span className="text-xs text-[#6B655D]">ms</span>
          </div>
          <p className="text-[11px] text-[#6B655D] mt-0.5 truncate">
            {telemetry?.ollama_model || "Qwen2.5 7B (Ollama Local)"}
          </p>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Audit Compliance</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">{auditLogs.length}</span>
            <span className="text-xs text-[#6B655D]">events logged</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Document Table & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Master Control (2 columns) */}
        <div className="lg:col-span-2 aegis-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-[#ECE9E2]">
            <div>
              <h2 className="text-sm font-semibold text-[#1F1D1A]">
                Document Inventory & Lifecycle
              </h2>
              <p className="text-[11px] text-[#6B655D] mt-0.5">
                Upload, verify vector embeddings, and delete files.
              </p>
            </div>

            <div className="w-full sm:w-56">
              <Input
                placeholder="Search documents..."
                prefix={<Search className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                className="text-xs"
              />
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredDocs}
            rowKey="id"
            pagination={{ pageSize: 6, size: "small", showSizeChanger: false }}
            loading={isLoading}
            size="middle"
            className="aegis-table"
          />
        </div>

        {/* Real-time Audit Trail (1 column) */}
        <div className="aegis-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E2]">
            <div>
              <h2 className="text-sm font-semibold text-[#1F1D1A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#785233]" />
                Audit Trail
              </h2>
            </div>
            <span className="text-[10px] text-[#785233] bg-[#F7F5F0] px-2 py-0.5 rounded-full font-semibold border border-[#E5E1D8]">
              Live
            </span>
          </div>

          <div className="overflow-y-auto max-h-[500px] pr-1">
            <Timeline
              items={auditLogs.map((log) => ({
                color: "#785233",
                children: (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-[#6B655D]">
                      <span className="font-semibold text-[#1F1D1A]">{log.actor}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="font-medium text-[#1F1D1A]">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-[#6B655D] leading-relaxed">
                        {log.details}
                      </p>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        open={showUpload}
        onCancel={() => setShowUpload(false)}
        footer={null}
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1D1A] pb-1">
            <Upload className="w-4 h-4 text-[#785233]" />
            <span>Upload Document to Enterprise Library</span>
          </div>
        }
        width={560}
        destroyOnClose
      >
        <div className="py-2">
          <UploadZone onComplete={handleUploadComplete} />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!docToDelete}
        onCancel={() => setDocToDelete(null)}
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
            <AlertTriangle className="w-4 h-4" />
            <span>Confirm File Deletion</span>
          </div>
        }
        onOk={handleDeleteDocument}
        okText={isDeleting ? "Deleting..." : "Delete Document"}
        okButtonProps={{ danger: true, loading: isDeleting, className: "!bg-[#991B1B] text-xs font-medium" }}
        cancelButtonProps={{ className: "text-xs font-medium" }}
      >
        <div className="space-y-2 py-2 text-xs leading-relaxed text-[#6B655D]">
          <p>
            Are you sure you want to delete <strong className="text-[#1F1D1A]">&ldquo;{docToDelete?.filename}&rdquo;</strong>?
          </p>
          <p>
            This action will permanently delete the document record and remove its corresponding vector embeddings from ChromaDB.
          </p>
        </div>
      </Modal>
    </div>
  );
}
