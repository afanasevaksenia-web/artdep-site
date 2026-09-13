import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { floorCast, floorDepts, floorTransport, overtimeOf, project, shiftLen, type FloorRow } from "@/lib/seed";
import { FloorBoard, hereNames, missingNames } from "@/components/floor-board";
import { useSmena, type Punch } from "@/lib/store";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_app/floor")({ component: Floor });

const tabs: { id: "transport" | "cast" | "dept"; label: string; rows: FloorRow[] }[] = [
  { id: "transport", label: "Транспорт", rows: floorTransport },
  { id: "cast", label: "Актёры", rows: floorCast },
  { id: "dept", label: "Группа", rows: floorDepts },
];

function exportTimesheet(rows: FloorRow[], punch: Record<string, Punch>) {
  const header = ["Группа", "Имя", "Детали", "Вызов", "План стоп", "Приехал", "Стоп", "Уехал", "Смена", "Переработка"];
  const lines = rows.map((r) => {
    const p = punch[r.id];
    const end = p?.stop ?? p?.left;
    const worked = end ? shiftLen(p?.arrived ?? r.call, end) : "";
    const ot = end ? (overtimeOf(end, r.wrap) ?? "") : "";
    return [r.kind, r.name, r.detail ?? "", r.call, r.wrap, p?.arrived ?? "", p?.stop ?? "", p?.left ?? "", worked, ot];
  });
  downloadCsv(`tabel-smena-${project.day}.csv`, header, lines);
  toast("Табель выгружен в CSV");
}

function Floor() {
  const punch = useSmena((s) => s.punch);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("cast");
  const current = tabs.find((t) => t.id === tab)!;
  const all = [...floorTransport, ...floorCast, ...floorDepts];
  const missing = missingNames(all, punch);
  const here = hereNames(all, punch);

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">не спрашивать по рации</p>
        <button
          onClick={() => exportTimesheet(all, punch)}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent"
        >
          <Download className="size-3.5" /> табель .csv
        </button>
      </div>
      <h1 className="font-display text-3xl">Кто на площадке</h1>
      <p className="mt-1 text-sm text-muted">Вызов · приехал · стоп · уехал. Переработка от планового стопа.</p>

      <div className="mt-4 rounded-lg border border-line bg-card px-4 py-3">
        <div className="text-xs font-semibold text-ok">На площадке · {here.length}</div>
        <p className="text-sm text-muted">{here.length ? here.join(", ") : "пока никого"}</p>
        <div className="mt-3 text-xs font-semibold text-warn">Ещё нет · {missing.length}</div>
        <p className="text-sm text-muted">{missing.length ? missing.join(", ") : "все отмечены"}</p>
      </div>

      <div className="mt-4 mb-2 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 flex-1 rounded-md text-sm font-semibold",
              tab === t.id ? "bg-accent text-bg" : "border border-line bg-card text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-card px-4 py-2">
        <div className="flex justify-between py-2 text-xs text-faint">
          <span>{current.label}</span>
          <span>вызов справа</span>
        </div>
        <FloorBoard rows={current.rows} />
      </section>
    </div>
  );
}
