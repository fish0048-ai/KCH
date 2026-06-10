"use client";

import { useState } from "react";
import { groupCsvRows, parseStudentCsv } from "@/lib/import/csv";
import { importStudents } from "@/lib/firebase/seating";

export function ImportPanel({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const rows = parseStudentCsv(text);
      const grouped = groupCsvRows(rows);
      for (const [groupId, payload] of grouped.entries()) {
        await importStudents(groupId, payload.groupName, payload.students);
      }
      setMessage(`成功匯入 ${grouped.size} 個分組，共 ${rows.length} 位學生。`);
      onImported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "匯入失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">從 CSV 匯入學生資料</h3>
      <p className="mt-1 text-xs text-slate-500">
        可從 Google 試算表匯出 CSV。必要欄位：班級/分組、姓名；建議包含學號、段考成績。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={`班級,學號,姓名,段考成績\n8A,1,王小明,85\n8A,2,李小華,92`}
        className="mt-3 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={busy || !text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "匯入中…" : "匯入"}
        </button>
        {message ? <span className="text-xs text-slate-600">{message}</span> : null}
      </div>
    </section>
  );
}
