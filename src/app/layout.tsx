import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Noto_Sans_TC } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppNav } from "@/components/layout/AppNav";
import "./globals.css";

const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="zh-Hant" className={`${notoSansTc.variable} ${geistMono.variable} h-full`}>
      <body className="app-shell antialiased">
        <AuthProvider>
          <AppNav />
          <main className="app-main">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
