"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Input,
  Button,
  Drawer,
  Spin,
} from "antd";
import {
  Send,
  FileText,
  MessageSquare,
  Plus,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Search,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { qaService } from "@/services/qaService";
import type { Conversation, QAMessage, Citation } from "@/lib/types";

const { TextArea } = Input;

export default function QAPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [sourceCitations, setSourceCitations] = useState<Citation[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showSources, setShowSources] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    try {
      const full = await qaService.getConversation(conv.id);
      const convMessages = full.messages || [];
      setMessages(convMessages);
      const allCites = convMessages.flatMap((m) => m.citations || []);
      if (allCites.length > 0) {
        setSourceCitations(allCites);
        setSelectedCitation(allCites[0] || null);
        setShowSources(true);
      } else {
        setSourceCitations([]);
        setSelectedCitation(null);
        setShowSources(false);
      }
    } catch {
      const convMessages = conv.messages || [];
      setMessages(convMessages);
      const allCites = convMessages.flatMap((m) => m.citations || []);
      if (allCites.length > 0) {
        setSourceCitations(allCites);
        setSelectedCitation(allCites[0] || null);
        setShowSources(true);
      } else {
        setSourceCitations([]);
        setSelectedCitation(null);
        setShowSources(false);
      }
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await qaService.listConversations();
      setConversations(convs);
      if (convs.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConvs(false);
    }
  }, [selectConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const startNewConversation = () => {
    const newConv: Conversation = {
      id: "conv_new_" + Date.now(),
      title: "New Query",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConv(newConv);
    setMessages([]);
    setShowSources(false);
    setSourceCitations([]);
    setSelectedCitation(null);
  };

  const handleAsk = async () => {
    if (!input.trim() || isAsking) return;

    const userMessage: QAMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = input.trim();
    setInput("");
    setIsAsking(true);

    try {
      const response = await qaService.ask(currentQuestion, activeConv?.id);

      const assistantMessage: QAMessage = {
        id: "msg_" + Date.now() + "_a",
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.citations && response.citations.length > 0) {
        setSourceCitations(response.citations);
        setSelectedCitation(response.citations[0] || null);
        setShowSources(true);
      }

      if (activeConv?.title === "New Query") {
        const title =
          currentQuestion.length > 34
            ? currentQuestion.substring(0, 34) + "..."
            : currentQuestion;
        setActiveConv((prev) => (prev ? { ...prev, title } : prev));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv?.id ? { ...c, title } : c))
        );
      }
    } catch (err) {
      console.error("Q&A error:", err);
      const errorMessage: QAMessage = {
        id: "msg_" + Date.now() + "_err",
        role: "assistant",
        content:
          "I couldn't complete the search across your indexed documents. Please verify your connection or try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCitationClick = (citations: Citation[], specificCitation?: Citation) => {
    setSourceCitations(citations);
    setSelectedCitation(specificCitation || citations[0] || null);
    setShowSources(true);
  };

  // Reusable citation list content
  const renderCitationCards = () => {
    if (sourceCitations.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <BookOpen className="w-8 h-8 text-[#D4CEC3] mx-auto mb-2" />
          <p className="text-xs font-medium text-[#6B655D]">No sources for current query</p>
          <p className="text-[11px] text-[#968F85] mt-1 leading-relaxed">
            AEGIS answers cite extracted document chunks with verified page and section references.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5">
        {sourceCitations.map((citation, idx) => {
          const isCurrent = selectedCitation?.chunk_id === citation.chunk_id;
          return (
            <div
              key={`${citation.chunk_id}-${idx}`}
              onClick={() => setSelectedCitation(citation)}
              className={cn(
                "p-3.5 rounded-xl border transition-all cursor-pointer text-left",
                isCurrent
                  ? "bg-[#FFFFFF] border-[#785233] shadow-xs ring-1 ring-[#785233]/20"
                  : "bg-[#FDFCF9] border-[#E5E1D8] hover:border-[#D4CEC3]"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#785233] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1F1D1A] truncate">
                      {citation.document_name}
                    </p>
                    <p className="text-[11px] text-[#6B655D]">
                      Page {citation.page}
                      {citation.section && ` • ${citation.section}`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5F0] text-[#6B655D] font-mono border border-[#E5E1D8] flex-shrink-0">
                  {citation.chunk_id}
                </span>
              </div>

              {/* Verbatim snippet text */}
              <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E5E1D8]">
                <p className="text-xs text-[#1F1D1A] leading-relaxed italic">
                  &ldquo;{citation.snippet}&rdquo;
                </p>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#6B655D]">
                <span className="text-[10px] text-[#968F85] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#166534]" />
                  ChromaDB vector index
                </span>
                <Link
                  href="/documents"
                  className="text-[#785233] hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#F7F5F0] text-[#1F1D1A] overflow-hidden">
      {/* ─── COLUMN 1: Left Conversations Sidebar ─── */}
      <div className="w-60 border-r border-[#E5E1D8] bg-[#FFFFFF] flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E5E1D8]">
          <span className="text-xs font-semibold text-[#6B655D] uppercase tracking-wider">
            Conversations
          </span>
          <button
            onClick={startNewConversation}
            className="p-1 rounded text-[#785233] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoadingConvs ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-[#968F85]">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-colors text-xs font-medium cursor-pointer",
                  activeConv?.id === conv.id
                    ? "bg-[#F7F5F0] text-[#1F1D1A] font-semibold"
                    : "text-[#6B655D] hover:bg-[#FAF9F6] hover:text-[#1F1D1A]"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#968F85]" />
                <span className="truncate">{conv.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── COLUMN 2: Main Chat Viewport ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F5F0]">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E1D8] bg-[#FFFFFF]">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#1F1D1A] truncate">
              {activeConv?.title || "Document Q&A"}
            </h2>
            <p className="text-[11px] text-[#6B655D]">
              Verified answers with page & section citations
            </p>
          </div>

          <div className="flex items-center gap-2">
            {messages.some((m) => m.citations && m.citations.length > 0) && (
              <Button
                size="small"
                icon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (!showSources) {
                    const allCites = messages.flatMap((m) => m.citations || []);
                    if (sourceCitations.length === 0 && allCites.length > 0) {
                      setSourceCitations(allCites);
                      setSelectedCitation(allCites[0] || null);
                    }
                  }
                  setShowSources(!showSources);
                }}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer",
                  showSources
                    ? "!bg-[#785233] !text-[#FFFFFF] !border-[#785233]"
                    : "!border-[#D4CEC3] !text-[#1F1D1A] hover:!border-[#785233]"
                )}
              >
                <span>{showSources ? "Hide Sources" : "Sources"}</span>
                {sourceCitations.length > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                      showSources
                        ? "bg-[#FFFFFF]/25 text-[#FFFFFF]"
                        : "bg-[#F7F5F0] text-[#785233]"
                    )}
                  >
                    {sourceCitations.length}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-8">
              <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] border border-[#E5E1D8] flex items-center justify-center text-[#785233] mb-3 shadow-xs">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1D1A] mb-1">
                Ask about your documents
              </h3>
              <p className="text-xs text-[#6B655D] mb-5 leading-relaxed">
                Query operational procedures, technical specifications, or compliance standards. Every answer includes source citations.
              </p>

              <div className="w-full space-y-2 text-left">
                <p className="text-[10px] font-semibold text-[#968F85] uppercase tracking-wider px-1">
                  Suggested inquiries:
                </p>
                {[
                  "What is the normal discharge pressure of P-102?",
                  "What are the emergency shutdown procedures?",
                  "What are the high-pressure protective trip thresholds?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E1D8] hover:border-[#785233] transition-colors text-xs text-[#1F1D1A] flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#968F85] group-hover:text-[#785233] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn("max-w-[78%] space-y-2", isUser && "order-first")}>
                    <div
                      className={cn(
                        "rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed",
                        isUser
                          ? "bg-[#24211D] text-[#FDFCF9]"
                          : "bg-[#FFFFFF] text-[#1F1D1A] border border-[#E5E1D8] shadow-xs"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Citations Tag List */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((citation, idx) => (
                            <button
                              key={`${citation.chunk_id}-${idx}`}
                              onClick={() => handleCitationClick(msg.citations!, citation)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#D4CEC3] hover:border-[#785233] text-[11px] font-medium text-[#1F1D1A] transition-colors cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3 h-3 text-[#785233]" />
                              <span className="truncate max-w-[150px]">
                                {citation.document_name}
                              </span>
                              <span className="text-[#785233] font-semibold">
                                p.{citation.page}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isAsking && (
            <div className="flex gap-3 animate-fade-in">
              <div className="bg-[#FFFFFF] border border-[#E5E1D8] rounded-xl px-4 py-2.5 shadow-xs flex items-center gap-2.5">
                <Spin size="small" />
                <span className="text-xs text-[#6B655D]">
                  Searching your documents...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#E5E1D8] bg-[#FFFFFF]">
          <div className="max-w-4xl mx-auto rounded-xl bg-[#FDFCF9] border border-[#D4CEC3] focus-within:border-[#785233] transition-colors p-2.5">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Ask a question about your indexed documents... (Enter to send, Shift+Enter for newline)"
              autoSize={{ minRows: 2, maxRows: 6 }}
              variant="borderless"
              className="!text-xs sm:!text-sm !text-[#1F1D1A] placeholder:!text-[#968F85] !p-1 resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#ECE9E2] mt-1">
              <div className="text-[11px] text-[#968F85]">
                <span>Responses strictly grounded in documentation</span>
              </div>

              <Button
                type="primary"
                onClick={handleAsk}
                disabled={!input.trim() || isAsking}
                icon={<Send className="w-3.5 h-3.5" />}
                className="flex items-center gap-1.5 font-medium text-xs !h-7 !px-3 !bg-[#785233] hover:!bg-[#634329]"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COLUMN 3: Right Sources & Evidence Panel (Inline on desktop) ─── */}
      {showSources && (
        <aside className="hidden lg:flex w-88 xl:w-96 border-l border-[#E5E1D8] bg-[#FFFFFF] flex-col flex-shrink-0 h-full animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E1D8]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#785233]" />
              <span className="text-xs font-semibold text-[#1F1D1A] uppercase tracking-wider">
                Sources ({sourceCitations.length})
              </span>
            </div>
            <button
              onClick={() => setShowSources(false)}
              className="p-1 rounded text-[#968F85] hover:text-[#1F1D1A] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
              title="Close Sources Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {renderCitationCards()}
          </div>
        </aside>
      )}

      {/* ─── Mobile / Tablet Fallback: Drawer ─── */}
      <div className="lg:hidden">
        <Drawer
          open={showSources}
          onClose={() => setShowSources(false)}
          title={
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1D1A]">
              <BookOpen className="w-4 h-4 text-[#785233]" />
              <span>Source Citations ({sourceCitations.length})</span>
            </div>
          }
          placement="right"
          width={360}
        >
          {renderCitationCards()}
        </Drawer>
      </div>
    </div>
  );
}
