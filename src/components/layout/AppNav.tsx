"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function AppNav() {
  const { user, isTeacher, logout, signInWithGoogle, configured } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-base font-bold text-slate-900">
          俊鑫的主控教育系統
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {isTeacher && (
            <Link
              href="/teacher/seating"
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
            >
              座位表（教師）
            </Link>
          )}
          <Link
            href="/view/seating"
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
          >
            座位表（學生）
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                登出
              </button>
            </>
          ) : configured ? (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Google 登入
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
