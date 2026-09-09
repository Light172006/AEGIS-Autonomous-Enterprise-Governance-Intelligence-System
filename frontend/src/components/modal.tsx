"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative bg-aegis-surface border border-aegis-border rounded-xl shadow-2xl animate-slide-in-bottom",
          size === "sm" && "w-full max-w-md",
          size === "md" && "w-full max-w-lg",
          size === "lg" && "w-full max-w-2xl",
          size === "xl" && "w-full max-w-4xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-aegis-border">
          <h2 className="text-lg font-semibold text-aegis-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-aegis-text-muted hover:bg-aegis-surface-hover hover:text-aegis-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
