import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppNav } from "@/components/layout/AppNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "俊鑫的主控教育系統",
  description: "八年級九年級教學工具平台 — 座位表、題庫管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-slate-100 text-slate-900 antialiased">
        <AuthProvider>
          <AppNav />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
