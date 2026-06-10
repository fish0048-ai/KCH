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
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold">教師登入</h1>
      <p className="mt-2 text-sm text-slate-600">請使用 Google 帳號登入。僅白名單內的教師可進入管理功能。</p>
      {!configured ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          請先設定 Firebase 環境變數（參考 .env.example）。
        </p>
      ) : (
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          使用 Google 帳號登入
        </button>
      )}
      {user && !isTeacher ? (
        <p className="mt-4 text-xs text-red-600">
          目前帳號 {user.email} 沒有教師權限。
        </p>
      ) : null}
    </div>
  );
}
