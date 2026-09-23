"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Search,
  Upload,
  FileText,
  Trash2,
  Plus,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { documentService } from "@/services/documentService";
import { UploadZone } from "@/components/upload-zone";
import type { Document } from "@/lib/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.list();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await documentService.delete(deleteDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleteDoc(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.filename.toLowerCase().includes(q));
  }, [documents, search]);

  const columns: ColumnsType<Document> = [
    {
      title: "Document Name",
      dataIndex: "filename",
      key: "filename",
      render: (filename: string, record: Document) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-md bg-[#F7F5F0] border border-[#E5E1D8] text-[#785233] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#1F1D1A] truncate max-w-[280px]">
              {filename}
            </p>
            <p className="text-[11px] text-[#6B655D]">
              {record.pages} {record.pages === 1 ? "page" : "pages"} indexed
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
              ? "warning"
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
        <span className="text-xs text-[#1F1D1A] font-medium">{pages}</span>
      ),
    },
    {
      title: "Date Added",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at: string) => (
        <span className="text-xs text-[#6B655D]">
          {new Date(created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_: unknown, record: Document) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/qa?doc=${record.id}`}
            className="p-1.5 text-[#6B655D] hover:text-[#785233] hover:bg-[#F7F5F0] rounded transition-colors"
            title="Ask questions on this document"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Link>
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 className="w-3.5 h-3.5 text-[#991B1B]" />}
            onClick={() => setDeleteDoc(record)}
            title="Delete document"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fade-in text-[#1F1D1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1D1A]">
            Document Repository
          </h1>
          <p className="text-xs text-[#6B655D] mt-0.5">
            Indexed engineering manuals, operating specifications, and safety guidelines
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 font-medium text-xs !bg-[#785233] hover:!bg-[#634329] self-start sm:self-auto"
        >
          Upload Document
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3">
        <Input
          prefix={<Search className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
          placeholder="Filter documents by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-xs text-xs"
        />
        <span className="text-xs text-[#6B655D]">
          {filtered.length} {filtered.length === 1 ? "document" : "documents"} total
        </span>
      </div>

      {/* Table Container */}
      <div className="aegis-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            className="aegis-table"
          />
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1D1A] pb-1">
            <Upload className="w-4 h-4 text-[#785233]" />
            <span>Upload Document</span>
          </div>
        }
        open={showUpload}
        onCancel={() => setShowUpload(false)}
        footer={null}
        width={540}
        destroyOnClose
      >
        <div className="py-2">
          <UploadZone
            onComplete={() => {
              setShowUpload(false);
              loadDocuments();
            }}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
            <AlertCircle className="w-4 h-4" />
            <span>Confirm Deletion</span>
          </div>
        }
        open={!!deleteDoc}
        onCancel={() => setDeleteDoc(null)}
        onOk={handleDelete}
        okText="Delete"
        okButtonProps={{ danger: true, className: "!bg-[#991B1B] text-xs font-medium" }}
        cancelButtonProps={{ className: "text-xs font-medium" }}
      >
        <p className="text-xs text-[#6B655D] py-2">
          Are you sure you want to remove{" "}
          <strong className="text-[#1F1D1A]">{deleteDoc?.filename}</strong>? This will
          remove its indexed embeddings from ChromaDB.
        </p>
      </Modal>
    </div>
  );
}
