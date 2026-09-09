import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AEGIS — Autonomous Enterprise Governance Intelligence System",
  description:
    "Sophisticated AI-agent dashboard for enterprise document intelligence, grounded Q&A, and governance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-[#E5E1D8] selection:text-[#1F1D1A]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
