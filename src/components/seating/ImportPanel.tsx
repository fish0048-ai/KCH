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
    <section className="card p-4">
      <h3 className="text-sm font-bold text-[var(--ink)]">手動 CSV 匯入</h3>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        欄位：自然分組、班級、座號、姓名、加分
      </p>
      <label className="mt-3 block text-xs font-semibold text-[var(--ink-muted)]">
        分組名稱
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="input mt-1"
          placeholder="801A名單"
        />
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={`自然分組,班級,座號,姓名,加分\n801理A,801,2,蔡昀庭,2`}
        className="textarea mt-3 font-mono"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={busy || !text.trim()}
          className="btn btn-ghost text-xs disabled:opacity-50"
        >
          {busy ? "匯入中…" : "匯入 CSV"}
        </button>
        {message ? <span className="text-xs text-[var(--ink-muted)]">{message}</span> : null}
      </div>
    </section>
  );
}
