"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isTeacher, configured } = useAuth();

  if (!configured) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-sm text-[#8a5a00]">
        <p className="font-semibold">Firebase 尚未設定</p>
        <p className="mt-2 text-[var(--ink-muted)]">
          請先建立 <code className="rounded bg-[#f4f7fb] px-1">.env.local</code>，內容可參考{" "}
          <code className="rounded bg-[#f4f7fb] px-1">.env.example</code>。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card flex min-h-[40vh] items-center justify-center text-sm text-[var(--ink-muted)]">
        驗證登入狀態…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-bold text-[var(--ink)]">需要教師登入</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">此功能僅限教師使用 Google 帳號登入。</p>
        <Link href="/login" className="btn btn-primary mt-6 inline-flex">
          前往登入
        </Link>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="card mx-auto max-w-lg border-[#f5c4c4] bg-[var(--danger-soft)] p-8 text-center">
        <h2 className="text-lg font-bold text-[var(--danger)]">無教師權限</h2>
        <p className="mt-2 text-sm text-[var(--danger)]">
          帳號 <strong>{user.email}</strong> 不在教師白名單中。
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
