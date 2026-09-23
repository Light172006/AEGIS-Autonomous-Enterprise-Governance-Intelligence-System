"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button, Progress } from "antd";
import {
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  CloudUpload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { documentService } from "@/services/documentService";
import type { UploadProgress } from "@/lib/types";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

const STAGES: { key: UploadProgress["stage"]; label: string }[] = [
  { key: "uploaded", label: "Uploaded — Ingestion confirmed" },
  { key: "text_extraction", label: "Extracting text" },
  { key: "chunking", label: "Chunking — 500-char semantic windows" },
  { key: "embedding", label: "Creating embeddings" },
  { key: "vector_indexing", label: "Indexing — ChromaDB vector storage" },
  { key: "complete", label: "Ready — Available for verified Q&A" },
];

export function UploadZone({ onComplete }: { onComplete?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, []);

  const validateFile = (f: File): boolean => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(f.type)) {
      setError(`Unsupported format. Supported: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return false;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return false;
    }
    return true;
  };

  const simulateProcessingStages = (stage: number) => {
    if (stage >= STAGES.length) {
      setIsUploading(false);
      onComplete?.();
      return;
    }
    setCurrentStage(stage);
    const delay = stage === 0 ? 400 : 500 + Math.random() * 400;
    stageTimerRef.current = setTimeout(() => simulateProcessingStages(stage + 1), delay);
  };

  const handleUpload = async (f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
    setError(null);
    setIsUploading(true);
    setCurrentStage(0);

    try {
      await documentService.upload(f);
      simulateProcessingStages(1);
    } catch {
      setError("Failed to upload document. Please try again.");
      setIsUploading(false);
      setCurrentStage(-1);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleUpload(droppedFile);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleUpload(selected);
  };

  const reset = () => {
    setFile(null);
    setCurrentStage(-1);
    setIsUploading(false);
    setError(null);
    if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
  };

  if (file && (isUploading || currentStage >= STAGES.length - 1)) {
    const percent = Math.round(((currentStage + 1) / STAGES.length) * 100);

    return (
      <div className="space-y-4 animate-fade-in text-[#1F1D1A]">
        {/* File info banner */}
        <div className="flex items-center gap-3 p-3 bg-[#F7F5F0] rounded-lg border border-[#E5E1D8]">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#FFFFFF] border border-[#E5E1D8] text-[#785233]">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1F1D1A] truncate">{file.name}</p>
            <p className="text-[11px] text-[#6B655D]">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!isUploading && (
            <button onClick={reset} className="p-1 text-[#968F85] hover:text-[#1F1D1A]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <Progress
          percent={percent}
          strokeColor="#785233"
          showInfo={false}
          size="small"
        />

        {/* Processing stages list */}
        <div className="space-y-2 py-1">
          {STAGES.map((stage, idx) => {
            const isComplete = idx < currentStage;
            const isCurrent = idx === currentStage;
            const isPending = idx > currentStage;

            return (
              <div key={stage.key} className="flex items-center gap-2.5 text-xs">
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-[#166534] flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#785233] animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#D4CEC3] flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    isComplete && "text-[#166534]",
                    isCurrent && "text-[#785233] font-semibold",
                    isPending && "text-[#968F85]"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {currentStage >= STAGES.length - 1 && (
          <Button
            type="primary"
            onClick={reset}
            block
            className="!bg-[#785233] hover:!bg-[#634329] font-medium text-xs h-9"
          >
            Upload Another Document
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[#1F1D1A]">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "upload-zone p-8 flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center",
          isDragging && "drag-active"
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#FFFFFF] border border-[#E5E1D8] text-[#785233] shadow-xs">
          <CloudUpload className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1F1D1A]">
            {isDragging ? "Drop document to upload" : "Click to browse or drag and drop"}
          </p>
          <p className="text-[11px] text-[#6B655D] mt-0.5">
            PDF, DOCX, TXT, or MD (up to 50MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <p className="text-center text-[11px] text-[#968F85]">
        Documents are parsed, chunked into 500-character windows, and indexed into ChromaDB.
      </p>

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs">
          <X className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
