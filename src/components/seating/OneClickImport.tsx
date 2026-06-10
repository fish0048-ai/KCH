"use client";

import { useState } from "react";
import { importAllFromGoogleSheets, type ImportResult } from "@/lib/import/full-import";

export function OneClickImport({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    const ok = window.confirm(
      "將從 Google 試算表匯入全部資料到 Firebase。\n已存在的同 ID 資料會被覆寫，確定繼續？",
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const summary = await importAllFromGoogleSheets((p) => {
        setStep(p.detail ? `${p.step}：${p.detail}` : p.step);
      });
      setResult(summary);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "匯入失敗");
    } finally {
      setBusy(false);
      setStep(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#c5e3ef] bg-gradient-to-br from-[#eef8fc] to-[#f8fcff] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--brand-dark)]">一鍵匯入 Google 試算表</h3>
          <p className="mt-1 text-xs leading-6 text-[var(--ink-muted)]">
            來源：
            <a
              href="https://docs.google.com/spreadsheets/d/1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs/edit"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--brand)] underline"
            >
              八年級分組名單
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={busy}
          className="btn btn-primary text-xs disabled:opacity-60"
        >
          {busy ? "匯入中…" : "開始匯入"}
        </button>
      </div>
      {step ? <p className="mt-3 text-xs text-[var(--brand)]">{step}</p> : null}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["分組", result.groups],
            ["學生", result.students],
            ["段考", result.examRows],
            ["座位表", result.seating],
            ["加分", result.bonusLogs],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-white/80 px-3 py-2 text-center">
              <div className="text-lg font-bold text-[var(--brand-dark)]">{value as number}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">{label as string}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
