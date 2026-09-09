"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function AegisPreloader() {
  const { setHasSeenPreloader } = useAuthStore();
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState("");
  const fullText = "AEGIS";

  useEffect(() => {
    // Clear any stale sessionStorage key that blocked it previously
    try {
      sessionStorage.removeItem("aegis_preloader_seen");
    } catch {
      // ignore
    }

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 120);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setHasSeenPreloader(true);
      }, 400);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [setHasSeenPreloader]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="aegis-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F7F5F0] text-[#1F1D1A] select-none overflow-hidden"
        >
          {/* Subtle Ambient Warm Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#785233]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-[#785233]/8 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Elegant Shield Mark */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFFFFF] border border-[#E5E1D8] text-[#785233] shadow-md mb-6"
            >
              <Shield className="w-8 h-8 text-[#785233]" />
            </motion.div>

            {/* AEGIS _ with clean modern font */}
            <div className="flex items-center justify-center min-h-[64px]">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#1F1D1A] font-sans">
                {text}
              </h1>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.65, repeat: Infinity }}
                className="text-5xl sm:text-6xl font-light text-[#785233] ml-1 select-none"
              >
                _
              </motion.span>
            </div>

            {/* Full Form */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-sm sm:text-base font-normal text-[#6B655D] mt-3 tracking-normal max-w-md leading-relaxed"
            >
              Autonomous Enterprise Governance Intelligence System
            </motion.p>

            {/* Clean Progress Line */}
            <div className="w-52 h-1 bg-[#E5E1D8] rounded-full mt-8 overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="h-full bg-[#785233] rounded-full shadow-xs"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
