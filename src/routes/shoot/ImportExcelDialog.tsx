import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

// Целевые поля КПП. Соответствие колонкам файла задаёт пользователь на шаге
// сопоставления — раздел 5 CLAUDE.md: "по образцу файлов ОБЩИНЫ, но с шагом
// сопоставления колонок", т.к. у другой группы файл может выглядеть иначе.
const TARGET_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "number", label: "Сцена (номер)", required: true },
  { key: "mode", label: "Режим" },
  { key: "int_ext", label: "Инт/Нат" },
  { key: "story_day", label: "Сцен.день" },
  { key: "location", label: "Объект" },
  { key: "sub_location", label: "Подобъект" },
  { key: "synopsis", label: "Синопсис" },
  { key: "characters", label: "Персонажи" },
  { key: "costume_makeup", label: "Костюм/Грим" },
  { key: "props", label: "Реквизит/Игровые" },
  { key: "stunts", label: "Трюк/Каскадёры" },
];

type Row = (string | number | null)[];

export default function ImportExcelDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [mapping, setMapping] = useState<Record<string, number | "">>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const asRows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: "" });
      setRows(asRows);
    } catch (err: any) {
      setError("Не удалось прочитать файл: " + (err.message ?? String(err)));
    }
  }

  const headerRow = rows?.[headerRowIndex] ?? [];
  const dataRows = rows ? rows.slice(headerRowIndex + 1).filter((r) => r.some((c) => String(c ?? "").trim() !== "")) : [];

  function mappedPreview(limit = 5) {
    return dataRows.slice(0, limit).map((row) => {
      const obj: Record<string, string> = {};
      for (const f of TARGET_FIELDS) {
        const colIdx = mapping[f.key];
        obj[f.key] = colIdx === "" || colIdx === undefined ? "" : String(row[colIdx] ?? "");
      }
      return obj;
    });
  }

  async function handleImport() {
    if (mapping.number === "" || mapping.number === undefined) {
      setError("Обязательно сопоставьте колонку «Сцена (номер)»");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const toImport = dataRows
        .map((row) => {
          const obj: Record<string, string> = { project_id: projectId, created_by: userRes.user?.id ?? "" };
          for (const f of TARGET_FIELDS) {
            const colIdx = mapping[f.key];
            const value = colIdx === "" || colIdx === undefined ? "" : String(row[colIdx] ?? "").trim();
            (obj as any)[f.key] = value || null;
          }
          return obj;
        })
        .filter((r) => r.number && String(r.number).trim() !== "");

      if (toImport.length === 0) {
        setError("Не нашли ни одной строки со сценой — проверьте выбранную строку заголовка и колонку номера сцены");
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("scenes").upsert(toImport as any, { onConflict: "project_id,number" });
      if (error) throw error;

      setResult(`Импортировано / обновлено сцен: ${toImport.length}`);
      qc.invalidateQueries({ queryKey: ["scenes", projectId] });
    } catch (err: any) {
      setError(err.message ?? "Не удалось импортировать");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Импорт КПП из Excel</h2>
          <button onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>

        {!rows && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Загрузите файл КПП — например, по образцу «ОБЩИНЫ» (строка 1 — заголовок, строка 2 —
              шапка колонок). На следующем шаге вы сопоставите колонки своего файла с полями КПП.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="min-h-tap rounded-lg border border-border bg-bg px-3 py-2 text-text"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}

        {rows && !result && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Какая строка — заголовки колонок?
              <select
                value={headerRowIndex}
                onChange={(e) => setHeaderRowIndex(Number(e.target.value))}
                className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
              >
                {rows.slice(0, 10).map((_, idx) => (
                  <option key={idx} value={idx}>
                    Строка {idx + 1}: {rows[idx].slice(0, 4).join(" | ") || "(пусто)"}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Сопоставьте колонки</p>
              {TARGET_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center justify-between gap-2 text-sm text-muted">
                  <span>
                    {f.label}
                    {f.required && <span className="text-danger"> *</span>}
                  </span>
                  <select
                    value={mapping[f.key] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? "" : Number(e.target.value) }))
                    }
                    className="min-h-tap rounded-lg border border-border bg-bg px-2 text-text"
                  >
                    <option value="">—</option>
                    {headerRow.map((h, idx) => (
                      <option key={idx} value={idx}>
                        {String(h || `Колонка ${idx + 1}`)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-text">Предпросмотр ({dataRows.length} строк найдено)</p>
              <div className="max-h-40 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {TARGET_FIELDS.map((f) => (
                        <th key={f.key} className="p-1 text-muted">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedPreview().map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        {TARGET_FIELDS.map((f) => (
                          <td key={f.key} className="p-1 text-text">
                            {row[f.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setRows(null)} className="min-h-tap flex-1 rounded-lg border border-border text-text">
                Назад
              </button>
              <button
                disabled={importing}
                onClick={handleImport}
                className="min-h-tap flex-1 rounded-lg bg-accent font-medium text-white disabled:opacity-60"
              >
                {importing ? "Импортируем…" : "Импортировать"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <p className="text-text">{result}</p>
            <p className="text-sm text-muted">
              Повторный импорт этого же файла обновит существующие сцены по номеру, не задублирует.
            </p>
            <button onClick={onClose} className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white">
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
