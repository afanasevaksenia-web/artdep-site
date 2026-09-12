import { useState } from "react";
import { useHistory, useRevertHistory } from "../hooks/useHistory";

const ACTION_LABELS: Record<string, string> = { insert: "создано", update: "изменено", delete: "удалено" };

export default function HistoryPanel({
  projectId,
  tableName,
  rowId,
  invalidateKeys,
}: {
  projectId: string;
  tableName: "scenes" | "shifts";
  rowId: string;
  invalidateKeys: unknown[][];
}) {
  const [open, setOpen] = useState(false);
  const { data: rows } = useHistory(projectId, tableName, open ? rowId : null);
  const revert = useRevertHistory(invalidateKeys);

  return (
    <div className="mt-2">
      <button onClick={() => setOpen((v) => !v)} className="text-sm text-accent underline">
        {open ? "Скрыть историю" : "История правок"}
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-2">
          {rows?.length === 0 && <li className="text-sm text-muted">Правок пока нет.</li>}
          {rows?.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-bg p-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-text">
                  {ACTION_LABELS[row.action] ?? row.action} · {row.author_name ?? "неизвестно"} ·{" "}
                  {new Date(row.changed_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                </span>
                {row.old_data && (
                  <button
                    onClick={() => revert.mutate(row.id)}
                    disabled={revert.isPending}
                    className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-text disabled:opacity-60"
                  >
                    Отменить это изменение
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
