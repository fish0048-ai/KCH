import Link from "next/link";

export default function HomePage() {
  return (
    <div className="animate-fade-up space-y-8">
      <section className="hero-panel px-6 py-10 sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-white/70">TEACHING TOOLS v2</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">歡迎使用教學工具平台</h1>
          <p className="mt-4 text-sm leading-7 text-white/85 sm:text-base">
            梅花座位表、課堂抽籤、加分與成績顯示，一站完成。教師編排後可一鍵公布，學生無需登入即可查看。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/teacher/seating" className="btn btn-primary bg-white text-[var(--brand-dark)] shadow-lg hover:brightness-100">
              進入教師座位表
            </Link>
            <Link
              href="/view/seating"
              className="btn rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              學生檢視
            </Link>
            <Link
              href="/login"
              className="btn rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 hover:text-white"
            >
              教師登入 →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card group p-6 transition hover:-translate-y-0.5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-xl">
            🪑
          </div>
          <h2 className="text-lg font-bold text-[var(--ink)]">梅花座位表</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
            多分組、隨機排座、封鎖與固定座位、課堂抽籤、加分、缺勤與段考成績顯示。
          </p>
          <span className="badge badge-brand mt-4">已上線</span>
        </article>

        <article className="card-soft p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f3f8] text-xl">
            📚
          </div>
          <h2 className="text-lg font-bold text-[var(--ink-muted)]">試卷題庫</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
            題庫搜尋、審核、Word 匯入與自動組卷功能，將於下一階段移植。
          </p>
          <span className="badge badge-muted mt-4">規劃中</span>
        </article>
      </section>
    </div>
  );
}
