"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Dropdown, type MenuProps } from "antd";
import {
  LogOut,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { status: gatewayStatus, checkHealth } = useHealthCheck(30000);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Human-readable breadcrumb context
  const getContextName = () => {
    if (pathname === "/dashboard") return "Workspace Overview";
    if (pathname.startsWith("/qa")) return "Enterprise Q&A";
    if (pathname.startsWith("/documents/upload")) return "Ingest Document";
    if (pathname.startsWith("/documents")) return "Document Repository";
    if (pathname.startsWith("/settings")) return "System Settings";
    if (pathname.startsWith("/admin")) return "Administrative Console";
    return "Enterprise Workspace";
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      disabled: true,
      label: (
        <div className="py-1 px-1 text-xs">
          <p className="font-medium text-[#1F1D1A]">{user?.name || "User"}</p>
          <p className="text-[11px] text-[#6B655D]">{user?.email}</p>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <Settings className="w-3.5 h-3.5 text-[#6B655D]" />,
      label: <span className="text-xs text-[#1F1D1A]">Settings</span>,
      onClick: () => router.push("/settings"),
    },
    {
      key: "logout",
      danger: true,
      icon: <LogOut className="w-3.5 h-3.5" />,
      label: <span className="text-xs">Sign out</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E5E1D8] px-5 flex items-center justify-between flex-shrink-0 z-10 select-none">
      {/* Context breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-normal text-[#6B655D]">
        <Link
          href="/dashboard"
          className="hover:text-[#1F1D1A] transition-colors flex items-center gap-1.5"
        >
          <span>AEGIS</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#968F85]" />
        <span className="font-medium text-[#1F1D1A]">{getContextName()}</span>
      </div>

      {/* Right controls: Gateway indicator & Profile */}
      <div className="flex items-center gap-4">
        {/* System Status Indicator */}
        <button
          onClick={() => checkHealth()}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7F5F0] border border-[#E5E1D8] text-[11px] text-[#6B655D] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
          title={
            gatewayStatus === "online"
              ? "FastAPI Gateway connected (/api/v1/health)"
              : gatewayStatus === "offline"
              ? "FastAPI Gateway offline — running in isolated mock mode"
              : "Checking gateway connection..."
          }
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              gatewayStatus === "online"
                ? "bg-[#166534] animate-pulse-dot"
                : gatewayStatus === "offline"
                ? "bg-[#9A3412]"
                : "bg-[#968F85]"
            }`}
          />
          <span className="font-medium">
            {gatewayStatus === "online"
              ? "Gateway Active"
              : gatewayStatus === "offline"
              ? "Standby Mode"
              : "Connecting..."}
          </span>
        </button>

        {/* User Profile Pill */}
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <button className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg hover:bg-[#F7F5F0] transition-colors cursor-pointer border border-transparent hover:border-[#E5E1D8]">
            <Avatar
              size={26}
              style={{ backgroundColor: "#785233", color: "#FFFFFF" }}
              className="text-[11px] font-semibold"
            >
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </Avatar>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-medium text-[#1F1D1A] leading-tight block">
                {user?.name?.split(" ")[0] || "User"}
              </span>
              <span className="text-[10px] text-[#6B655D] capitalize leading-none block">
                {user?.role || "user"}
              </span>
            </div>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
