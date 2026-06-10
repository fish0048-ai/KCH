"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isTeacher, configured } = useAuth();

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Firebase 尚未設定</p>
        <p className="mt-2">
          請先建立 <code className="rounded bg-white px-1">.env.local</code>，內容可參考{" "}
          <code className="rounded bg-white px-1">.env.example</code>。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        驗證登入狀態…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">需要教師登入</h2>
        <p className="mt-2 text-sm text-slate-600">此功能僅限教師使用 Google 帳號登入。</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          前往登入
        </Link>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-bold text-red-900">無教師權限</h2>
        <p className="mt-2 text-sm text-red-800">
          帳號 <strong>{user.email}</strong> 不在教師白名單中。
        </p>
        <p className="mt-2 text-xs text-red-700">
          請在 Vercel / .env.local 設定 <code>NEXT_PUBLIC_TEACHER_EMAILS</code>。
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
