"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Modal,
  Spin,
  Empty,
} from "antd";
import {
  FileText,
  MessageSquare,
  Activity,
  Upload,
  ArrowRight,
  Shield,
  Cpu,
  Database,
  CheckCircle2,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { UploadZone } from "@/components/upload-zone";
import type { DashboardStats, Document, SystemTelemetry } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashData, telemData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTelemetry(),
      ]);
      setStats(dashData.stats);
      setRecentDocs(dashData.recent_documents);
      setTelemetry(telemData);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = async () => {
    setShowUpload(false);
    await loadDashboard();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[65vh] gap-3">
        <Spin />
        <p className="text-xs text-[#6B655D] font-medium">Loading workspace metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-[#1F1D1A]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E1D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1D1A]">
            Engineering Workspace
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Grounded documentation search, operational intelligence, and verified source citations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 font-medium text-xs !border-[#D4CEC3] !text-[#1F1D1A] hover:!border-[#785233] hover:!text-[#785233]"
          >
            Upload Document
          </Button>

          <Link href="/qa">
            <Button
              type="primary"
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              className="flex items-center gap-1.5 font-medium text-xs !bg-[#785233] hover:!bg-[#634329]"
            >
              Ask Documentation
            </Button>
          </Link>
        </div>
      </div>

      {/* Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Indexed Documents</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">
              {stats?.documents_count ?? recentDocs.length}
            </span>
            <span className="text-[11px] text-[#166534] font-medium">Ready for search</span>
          </div>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Questions Processed</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">
              {stats?.questions_asked ?? 0}
            </span>
            <span className="text-[11px] text-[#6B655D]">Verifiable answers</span>
          </div>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Vector Embeddings</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1F1D1A]">
              {telemetry?.total_vectors ?? 0}
            </span>
            <span className="text-[11px] text-[#6B655D]">Semantic chunks</span>
          </div>
        </div>

        <div className="aegis-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655D]">Local Intelligence</span>
            <div className="w-7 h-7 rounded-md bg-[#F7F5F0] flex items-center justify-center text-[#785233]">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-semibold text-[#1F1D1A] truncate">
              {telemetry?.ollama_model ? telemetry.ollama_model.split(":")[0] : "qwen2.5"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#166534] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Documents & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Table (2 columns) */}
        <div className="lg:col-span-2 aegis-card p-5">
          <div className="flex items-center justify-between pb-4 mb-3 border-b border-[#ECE9E2]">
            <div>
              <h2 className="text-sm font-semibold text-[#1F1D1A]">Recent Documents</h2>
              <p className="text-[11px] text-[#6B655D]">
                Indexed files accessible across the enterprise workspace
              </p>
            </div>
            <Link
              href="/documents"
              className="text-xs font-medium text-[#785233] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No documents uploaded yet"
              className="my-8"
            >
              <Button
                type="primary"
                onClick={() => setShowUpload(true)}
                className="!bg-[#785233] text-xs font-medium"
              >
                Upload First Document
              </Button>
            </Empty>
          ) : (
            <div className="divide-y divide-[#ECE9E2]">
              {recentDocs.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E5E1D8] flex items-center justify-center text-[#785233] flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1F1D1A] truncate">
                        {doc.filename}
                      </p>
                      <p className="text-[11px] text-[#968F85]">
                        {doc.pages} {doc.pages === 1 ? "page" : "pages"} • Ingested{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#166534]">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </span>
                    <Link
                      href={`/qa?doc=${doc.id}`}
                      className="text-xs text-[#6B655D] hover:text-[#785233] p-1.5"
                      title="Query this document"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & Architecture Status Panel (1 column) */}
        <div className="aegis-card p-5 space-y-4">
          <div className="pb-3 border-b border-[#ECE9E2]">
            <h2 className="text-sm font-semibold text-[#1F1D1A]">System Health</h2>
            <p className="text-[11px] text-[#6B655D]">Local processing infrastructure</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#6B655D] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#166534]" />
                FastAPI Gateway
              </span>
              <span className="font-mono text-[11px] text-[#1F1D1A]">Port 8000</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#6B655D] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#166534]" />
                ChromaDB Vector Store
              </span>
              <span className="text-[11px] text-[#1F1D1A]">Connected</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#6B655D] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#166534]" />
                Inference Engine
              </span>
              <span className="font-mono text-[11px] text-[#1F1D1A]">
                {telemetry?.ollama_model || "Qwen2.5"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#6B655D] flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#968F85]" />
                Average Latency
              </span>
              <span className="font-mono text-[11px] text-[#1F1D1A]">
                {telemetry?.avg_latency_ms || 240} ms
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ECE9E2]">
            <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E5E1D8]">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#785233] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1F1D1A]">Zero Hallucination Policy</p>
                  <p className="text-[11px] text-[#6B655D] mt-0.5 leading-relaxed">
                    Responses are strictly synthesized from matched document chunks. Uncited facts are refused by the governance orchestrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#1F1D1A] font-semibold text-sm pb-1">
            <Upload className="w-4 h-4 text-[#785233]" />
            <span>Upload Engineering Document</span>
          </div>
        }
        open={showUpload}
        onCancel={() => setShowUpload(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <div className="py-2">
          <UploadZone onComplete={handleUploadComplete} />
        </div>
      </Modal>
    </div>
  );
}
