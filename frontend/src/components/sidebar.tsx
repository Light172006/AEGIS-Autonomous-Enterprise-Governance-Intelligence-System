"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Tooltip } from "antd";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/qa", label: "Q&A", icon: MessageSquare },
    { href: "/documents", label: "Documents", icon: FileText },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin Console", icon: SlidersHorizontal }]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#FFFFFF] border-r border-[#E5E1D8] transition-all duration-200 ease-in-out select-none flex-shrink-0 z-20",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#E5E1D8] flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E5E1D8] text-[#785233] flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sm font-semibold tracking-tight text-[#1F1D1A]">
                AEGIS
              </span>
              <span className="text-[10px] text-[#968F85] block -mt-1 font-mono">
                v1.0
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Quick Action: New Query */}
      <div className="p-2.5 flex-shrink-0">
        <Tooltip title={collapsed ? "New Question" : undefined} placement="right">
          <button
            onClick={() => router.push("/qa")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#785233] hover:bg-[#634329] text-[#FFFFFF] text-xs font-medium transition-colors cursor-pointer shadow-xs",
              collapsed && "justify-center px-0"
            )}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>New Query</span>}
          </button>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

          return (
            <Tooltip
              key={item.href}
              title={collapsed ? item.label : undefined}
              placement="right"
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[#F7F5F0] text-[#1F1D1A] font-semibold"
                    : "text-[#6B655D] hover:bg-[#FAF9F6] hover:text-[#1F1D1A]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-[#785233]" : "text-[#968F85]"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="p-2 border-t border-[#E5E1D8] space-y-1">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 text-xs text-[#968F85] hover:text-[#1F1D1A] hover:bg-[#F7F5F0] rounded-md transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <div className="flex items-center gap-2 text-[11px] w-full px-2">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </div>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-[#991B1B] hover:bg-[#FEF2F2] transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
