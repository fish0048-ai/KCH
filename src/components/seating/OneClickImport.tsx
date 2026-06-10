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
      "將從 Google 試算表匯入全部資料（名單、段考、座位表、加分記錄）到 Firebase。\n\n已存在的同 ID 資料會被覆寫。確定繼續？",
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
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-blue-900">一鍵匯入 Google 試算表</h3>
      <p className="mt-1 text-xs text-blue-800">
        來源：
        <a
          href="https://docs.google.com/spreadsheets/d/1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs/edit"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          八年級分組名單
        </a>
        （801A / 804A / 806B 名單、段考、座位表、加分記錄）
      </p>
      <button
        type="button"
        onClick={handleImport}
        disabled={busy}
        className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {busy ? "匯入中…" : "一鍵匯入全部資料"}
      </button>
      {step ? <p className="mt-2 text-xs text-blue-700">{step}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {result ? (
        <ul className="mt-2 space-y-1 text-xs text-blue-900">
          <li>分組：{result.groups} 個</li>
          <li>學生：{result.students} 位</li>
          <li>段考成績：{result.examRows} 筆</li>
          <li>座位表：{result.seating} 份</li>
          <li>加分記錄：{result.bonusLogs} 筆</li>
        </ul>
      ) : null}
    </section>
  );
}
