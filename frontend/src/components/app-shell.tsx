"use client";

import { usePathname } from "next/navigation";
import { ConfigProvider, App } from "antd";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { AegisPreloader } from "@/components/preloader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#785233",
          colorPrimaryHover: "#634329",
          colorPrimaryActive: "#4F3520",
          colorBgBase: "#F7F5F0",
          colorBgContainer: "#FFFFFF",
          colorBgElevated: "#FFFFFF",
          colorBorder: "#E5E1D8",
          colorBorderSecondary: "#ECE9E2",
          colorText: "#1F1D1A",
          colorTextSecondary: "#6B655D",
          colorTextTertiary: "#968F85",
          colorSuccess: "#166534",
          colorWarning: "#9A3412",
          colorError: "#991B1B",
          colorInfo: "#785233",
          borderRadius: 8,
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Card: {
            colorBgContainer: "#FFFFFF",
            colorBorderSecondary: "#E5E1D8",
            borderRadiusLG: 10,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Input: {
            colorBgContainer: "#FFFFFF",
            colorBorder: "#D4CEC3",
            borderRadius: 8,
            controlHeight: 38,
          },
          Table: {
            headerBg: "#F7F5F0",
            headerColor: "#6B655D",
            rowHoverBg: "#FAF9F6",
            borderColor: "#ECE9E2",
            borderRadius: 8,
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Tabs: {
            inkBarColor: "#785233",
            itemActiveColor: "#1F1D1A",
            itemSelectedColor: "#1F1D1A",
            itemHoverColor: "#785233",
          },
          Drawer: {
            colorBgElevated: "#FFFFFF",
          },
          Modal: {
            contentBg: "#FFFFFF",
            headerBg: "#FFFFFF",
          },
        },
      }}
    >
      <App>
        <AegisPreloader />
        <AuthGuard>
          {isLoginPage ? (
            <main className="min-h-screen bg-[#F7F5F0]">{children}</main>
          ) : (
            <div className="flex h-screen overflow-hidden bg-[#F7F5F0]">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          )}
        </AuthGuard>
      </App>
    </ConfigProvider>
  );
}
