"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Avatar, Tag, Input } from "antd";
import {
  Shield,
  Server,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in text-[#1F1D1A]">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E1D8]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1D1A]">
          Settings & Configuration
        </h1>
        <p className="text-xs text-[#6B655D] mt-0.5">
          Enterprise workspace credentials, API connection, and privacy enforcement
        </p>
      </div>

      {/* User Identity Card */}
      <div className="aegis-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[#6B655D] uppercase tracking-wider">
          User Identity
        </h2>

        <div className="flex items-center gap-4">
          <Avatar
            size={48}
            style={{ backgroundColor: "#785233", color: "#FFFFFF" }}
            className="text-base font-semibold"
          >
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-[#1F1D1A]">{user?.name || "User"}</p>
            <p className="text-xs text-[#6B655D]">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Tag color="default" className="!rounded !text-[10px] capitalize !font-medium">
                {user?.role || "user"}
              </Tag>
              <span className="text-[11px] text-[#968F85]">
                Department: {user?.department || "Operations & Engineering"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway & Network Configuration */}
      <div className="aegis-card p-5 space-y-4">
        <h2 className="text-xs font-semibold text-[#6B655D] uppercase tracking-wider">
          API Gateway Configuration
        </h2>

        <div className="space-y-3 max-w-xl">
          <div>
            <label className="block text-xs font-medium text-[#1F1D1A] mb-1">
              FastAPI Gateway Base Endpoint
            </label>
            <Input
              value={apiUrl}
              readOnly
              prefix={<Server className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
              className="text-xs font-mono bg-[#F7F5F0]"
            />
            <p className="text-[11px] text-[#968F85] mt-1">
              Set via NEXT_PUBLIC_API_URL environment variable.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#DCFCE7] text-[#166534] text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Direct Gateway Isolation Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Compliance & Local Privacy Rules */}
      <div className="aegis-card p-5 space-y-3">
        <h2 className="text-xs font-semibold text-[#6B655D] uppercase tracking-wider">
          Enterprise Governance & Privacy Policy
        </h2>

        <div className="space-y-2 text-xs text-[#6B655D] leading-relaxed">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F7F5F0]">
            <Lock className="w-4 h-4 text-[#785233] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-[#1F1D1A]">Strict API Isolation</p>
              <p className="text-[11px] text-[#6B655D] mt-0.5">
                The frontend communicates strictly with the FastAPI Gateway. Direct connections to PostgreSQL, ChromaDB, and raw LLM engines are blocked at the network perimeter.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F7F5F0]">
            <Shield className="w-4 h-4 text-[#785233] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-[#1F1D1A]">Zero Hallucination Grounding</p>
              <p className="text-[11px] text-[#6B655D] mt-0.5">
                All model responses are grounded in verified vector chunks with exact document and page citations. Speculative claims are eliminated by governance guards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
