"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Tabs, Alert } from "antd";
import { Shield, Lock, ArrowRight, Mail, Key } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const [role, setRole] = useState<"admin" | "user">("admin");
  const [email, setEmail] = useState("admin@aegis.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Ensure clean sign-in state on mount
    logout();
  }, [logout]);

  const handleRoleChange = (activeKey: string) => {
    const selectedRole = activeKey as "admin" | "user";
    setRole(selectedRole);
    setError("");
    if (selectedRole === "admin") {
      setEmail("admin@aegis.local");
      setPassword("admin123");
    } else {
      setEmail("user@aegis.local");
      setPassword("user123");
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch {
      setError("Unable to verify credentials. Please check your details and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F7F5F0]">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E1D8] rounded-xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#E5E1D8] text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#F7F5F0] border border-[#E5E1D8] text-[#785233] mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-[#1F1D1A] tracking-tight">AEGIS</h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Autonomous Enterprise Governance Intelligence System
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-4 text-xs"
            />
          )}

          {/* Quick Demo Role Selector */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#6B655D]">Select Account:</span>
            </div>
            <Tabs
              activeKey={role}
              onChange={handleRoleChange}
              items={[
                {
                  key: "admin",
                  label: "Administrator",
                },
                {
                  key: "user",
                  label: "Field Engineer",
                },
              ]}
              className="aegis-tabs"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#1F1D1A] mb-1.5">
                Work Email
              </label>
              <Input
                prefix={<Mail className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1F1D1A] mb-1.5">
                Password
              </label>
              <Input.Password
                prefix={<Key className="w-3.5 h-3.5 text-[#968F85] mr-1" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 !bg-[#785233] hover:!bg-[#634329] !border-none !text-white font-medium text-xs h-10"
            >
              <span>Sign In to Workspace</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </form>

          {/* Safe On-Premise Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-[#E5E1D8] text-center">
            <p className="text-[11px] text-[#968F85] flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-[#785233]" />
              <span>Local-first architecture • Documents never leave on-premise gateway</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
