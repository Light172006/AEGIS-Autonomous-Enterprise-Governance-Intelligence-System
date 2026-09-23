"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  Button,
  Select,
  Tag,
  Modal,
  Form,
  Input,
  Avatar,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  ArrowLeft,
  AlertTriangle,
  Building,
  Shield,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // New user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user" | "viewer">("user");
  const [newDept, setNewDept] = useState("Operations");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail) return;
    setIsSubmitting(true);
    try {
      await usersApi.create({
        name: newName,
        email: newEmail,
        role: newRole,
        department: newDept,
      });
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      await loadUsers();
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: "admin" | "user" | "viewer") => {
    try {
      await usersApi.updateRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const updated = await usersApi.toggleStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: updated.status } : u))
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersApi.delete(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: ColumnsType<User> = [
    {
      title: "Name & Email",
      dataIndex: "name",
      key: "name",
      render: (_: string, record: User) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar
            style={{ backgroundColor: "#785233", color: "#FFFFFF" }}
            className="flex-shrink-0 font-bold text-xs"
          >
            {record.name[0]}
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#1F1D1A] truncate">
              {record.name}
            </p>
            <p className="text-[11px] text-[#6B655D] truncate">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: "admin" | "user" | "viewer", record: User) => (
        <Select
          value={role}
          onChange={(val) => handleRoleChange(record.id, val)}
          size="small"
          className="w-32"
          options={[
            { value: "admin", label: "Administrator" },
            { value: "user", label: "Team Member" },
            { value: "viewer", label: "Viewer" },
          ]}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: User) => (
        <Tag
          color={status === "active" ? "success" : "default"}
          onClick={() => handleToggleStatus(record.id)}
          className="!rounded-md capitalize text-[11px] font-medium cursor-pointer"
        >
          {status || "active"}
        </Tag>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept: string) => (
        <span className="text-xs text-[#6B655D]">{dept || "Operations"}</span>
      ),
    },
    {
      title: "Docs Permitted",
      dataIndex: "documents_count",
      key: "documents_count",
      render: (count: number) => (
        <span className="text-xs text-[#1F1D1A] font-medium">{count ?? 0}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_: unknown, record: User) => (
        <Button
          type="text"
          danger
          size="small"
          disabled={record.email === "admin@aegis.local"}
          icon={<Trash2 className="w-3.5 h-3.5 text-[#991B1B]" />}
          onClick={() => setUserToDelete(record)}
          title={
            record.email === "admin@aegis.local"
              ? "Cannot delete primary admin"
              : "Remove user"
          }
        />
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-[#1F1D1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-[#785233] hover:text-[#634329] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Overview</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1D1A] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#785233]" />
            User & Access Governance
          </h1>
          <p className="text-xs text-[#6B655D] mt-0.5">
            Manage organization members, assign role permissions, and control access to company documents.
          </p>
        </div>

        <Button
          type="primary"
          icon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 !bg-[#785233] hover:!bg-[#634329] font-medium text-xs self-start sm:self-auto"
        >
          Add Team Member
        </Button>
      </div>

      {/* Role Explanations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="aegis-card p-4">
          <h3 className="font-semibold text-[#785233] flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5" />
            Administrator
          </h3>
          <p className="text-[11px] text-[#6B655D] leading-relaxed">
            Full control: Ingest company files, delete vector indexes, manage team permissions, and audit all logs.
          </p>
        </div>

        <div className="aegis-card p-4">
          <h3 className="font-semibold text-[#1F1D1A] flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-[#785233]" />
            Team Member (User)
          </h3>
          <p className="text-[11px] text-[#6B655D] leading-relaxed">
            Operational access: Ask grounded AI questions, inspect citations, and browse library documents.
          </p>
        </div>

        <div className="aegis-card p-4">
          <h3 className="font-semibold text-[#6B655D] flex items-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-[#785233]" />
            Viewer
          </h3>
          <p className="text-[11px] text-[#6B655D] leading-relaxed">
            Read-only inquiries: Can query documents and inspect citations without editing privileges.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B655D] font-medium">Filter:</span>
          {["all", "admin", "user", "viewer"].map((r) => (
            <Button
              key={r}
              size="small"
              onClick={() => setRoleFilter(r)}
              className={
                roleFilter === r
                  ? "!bg-[#785233] !text-[#FFFFFF] !border-[#785233] font-semibold capitalize text-xs"
                  : "!border-[#D4CEC3] !text-[#6B655D] capitalize text-xs"
              }
            >
              {r}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search by name, email, department..."
            prefix={<Search className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="aegis-card overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: false }}
          loading={isLoading}
          className="aegis-table"
        />
      </div>

      {/* Add User Modal */}
      <Modal
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1D1A] pb-1">
            <UserPlus className="w-4 h-4 text-[#785233]" />
            <span>Add Team Member</span>
          </div>
        }
        onOk={handleCreateUser}
        okText={isSubmitting ? "Creating..." : "Save Member"}
        okButtonProps={{ loading: isSubmitting, className: "!bg-[#785233] text-xs font-medium" }}
        cancelButtonProps={{ className: "text-xs font-medium" }}
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label={<span className="text-xs font-semibold text-[#1F1D1A]">Full Name</span>} required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </Form.Item>

          <Form.Item label={<span className="text-xs font-semibold text-[#1F1D1A]">Work Email</span>} required>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. priya.sharma@company.com"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item label={<span className="text-xs font-semibold text-[#1F1D1A]">Role</span>}>
              <Select
                value={newRole}
                onChange={(val) => setNewRole(val)}
                options={[
                  { value: "user", label: "Team Member" },
                  { value: "admin", label: "Administrator" },
                  { value: "viewer", label: "Viewer" },
                ]}
              />
            </Form.Item>

            <Form.Item label={<span className="text-xs font-semibold text-[#1F1D1A]">Department</span>}>
              <Input
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="Operations"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        open={!!userToDelete}
        onCancel={() => setUserToDelete(null)}
        title={
          <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
            <AlertTriangle className="w-4 h-4" />
            <span>Remove Team Member</span>
          </div>
        }
        onOk={handleDeleteUser}
        okText="Remove Member"
        okButtonProps={{ danger: true, className: "!bg-[#991B1B] text-xs font-medium" }}
        cancelButtonProps={{ className: "text-xs font-medium" }}
      >
        <div className="space-y-2 py-2 text-xs leading-relaxed text-[#6B655D]">
          <p>
            Are you sure you want to remove <strong className="text-[#1F1D1A]">&ldquo;{userToDelete?.name}&rdquo;</strong> ({userToDelete?.email})?
          </p>
          <p>
            They will lose access to the system and will no longer be able to sign in.
          </p>
        </div>
      </Modal>
    </div>
  );
}
