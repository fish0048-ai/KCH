"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-white/15 text-white shadow-inner"
          : "text-white/78 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppNav() {
  const { user, isTeacher, logout, signInWithGoogle, configured } = useAuth();

  return (
    <header className="app-nav sticky top-0 z-40 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-bold ring-1 ring-white/20">
            俊
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">俊鑫的主控教育系統</span>
            <span className="block text-[10px] font-medium text-white/65">八年級 · 九年級教學平台</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5 pl-1">
          {isTeacher ? <NavLink href="/teacher/seating">教師座位表</NavLink> : null}
          <NavLink href="/view/seating">學生座位表</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-white/70 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="btn btn-ghost border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:border-white/40 hover:text-white"
              >
                登出
              </button>
            </>
          ) : configured ? (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="btn rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-dark)] hover:bg-white/90"
            >
              Google 登入
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
