"use client";

import { useState } from "react";
import { groupCsvRows, parseStudentCsv } from "@/lib/import/csv";
import { importStudents } from "@/lib/firebase/seating";

export function ImportPanel({ onImported }: { onImported: () => void }) {
  const [groupName, setGroupName] = useState("801A名單");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const rows = parseStudentCsv(text, { defaultGroupName: groupName });
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
        對應試算表「801A名單 / 804A名單 / 806B名單」分頁。欄位：自然分組、班級、座號、姓名、加分。
      </p>
      <label className="mt-3 block text-xs font-semibold text-slate-600">
        分組名稱（試算表分頁名）
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="801A名單"
        />
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={`自然分組,班級,座號,姓名,加分\n801理A,801,2,蔡昀庭,2\n801理A,801,3,王唯宇,2`}
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
