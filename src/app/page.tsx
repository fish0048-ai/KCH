import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">歡迎使用教學工具平台</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          目前優先建置「梅花座位表」模組。教師登入後可編排座位、抽籤加分；完成後可公布給學生檢視。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/teacher/seating"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            座位表（教師）
          </Link>
          <Link
            href="/view/seating"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
          >
            座位表（學生）
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            教師登入
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">梅花座位表</h2>
          <p className="mt-2 text-sm text-slate-600">
            多分組、隨機排座、封鎖／固定座位、課堂抽籤、加分、缺勤與段考成績顯示。
          </p>
        </article>
        <article className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <h2 className="font-bold text-slate-500">試卷題庫（規劃中）</h2>
          <p className="mt-2 text-sm text-slate-500">下一階段將移植題庫搜尋、審核與組卷功能。</p>
        </article>
      </section>
    </div>
  );
}
