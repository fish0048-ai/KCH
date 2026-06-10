"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, isTeacher, loading, signInWithGoogle, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isTeacher) {
      router.replace("/teacher/seating");
    }
  }, [user, isTeacher, loading, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <div className="card w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-2xl">
          🔐
        </div>
        <h1 className="text-xl font-bold text-[var(--ink)]">教師登入</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          使用 Google 帳號登入。僅白名單內的教師可進入管理功能。
        </p>
        {!configured ? (
          <p className="mt-4 rounded-xl bg-[var(--accent-soft)] p-3 text-xs text-[#8a5a00]">
            請先設定 Firebase 環境變數（參考 .env.example）。
          </p>
        ) : (
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="btn btn-primary mt-6 w-full py-3"
          >
            使用 Google 帳號登入
          </button>
        )}
        {user && !isTeacher ? (
          <p className="mt-4 rounded-xl bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">
            帳號 {user.email} 沒有教師權限。
          </p>
        ) : null}
      </div>
    </div>
  );
}
