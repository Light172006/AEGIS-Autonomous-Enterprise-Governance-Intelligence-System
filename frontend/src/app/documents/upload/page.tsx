"use client";

import { useRouter } from "next/navigation";
import { Button } from "antd";
import { ArrowLeft } from "lucide-react";
import { UploadZone } from "@/components/upload-zone";

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in text-[#1F1D1A]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={<ArrowLeft className="w-4 h-4 text-[#785233]" />}
          onClick={() => router.back()}
          className="hover:!bg-[#FFFFFF]"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F1D1A]">
            Ingest Document
          </h1>
          <p className="text-xs text-[#6B655D] mt-0.5">
            Add technical manuals or compliance guides to the on-premise knowledge repository
          </p>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="aegis-card p-6">
        <UploadZone onComplete={() => router.push("/documents")} />
      </div>

      {/* Processing Pipeline Info Card */}
      <div className="aegis-card p-5 space-y-3">
        <h3 className="text-xs font-semibold text-[#6B655D] uppercase tracking-wider">
          Ingestion Workflow
        </h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { step: "1", label: "Upload" },
            { step: "2", label: "Extract" },
            { step: "3", label: "Chunk" },
            { step: "4", label: "Embed" },
            { step: "5", label: "Index" },
          ].map((item) => (
            <div key={item.step}>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7F5F0] border border-[#E5E1D8] text-xs font-semibold text-[#785233] mx-auto">
                {item.step}
              </div>
              <p className="text-[10px] text-[#6B655D] mt-1 font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#6B655D] leading-relaxed pt-2 border-t border-[#ECE9E2]">
          Ingested files are parsed into semantic chunks and embedded in the ChromaDB vector database. When engineers ask questions, exact snippets are retrieved and cited verbatim.
        </p>
      </div>
    </div>
  );
}
