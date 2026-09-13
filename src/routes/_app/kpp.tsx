import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Download, List } from "lucide-react";
import { kpp, project } from "@/lib/seed";
import { cn } from "@/lib/cn";
import { useSmena } from "@/lib/store";
import { downloadCsv } from "@/lib/csv";
import type { KppDay, KppStatus } from "@/lib/kpp-data";

export const Route = createFileRoute("/_app/kpp")({ component: Kpp });

const filters = ["рядом", "съёмки", "все"] as const;
const YEAR = 2026;
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function badge(s: KppStatus) {
  if (s === "сегодня") return "bg-accent-dim text-accent";
  if (s === "завтра") return "bg-warn/20 text-warn";
  if (s === "снято") return "bg-surface text-faint";
  return "bg-surface text-muted";
}

function exportKpp() {
  downloadCsv(
    "kpp-obshina.csv",
    ["Дата", "Смена", "Локация", "Сцены", "Статус", "Ночь"],
    kpp.map((d) => [d.date, d.n ?? "", d.loc, d.scenes, d.status, d.night ? "да" : ""]),
  );
  toast(`КПП · ${kpp.length} дней выгружено в CSV`);
}

type MonthCell = { day: number; d?: KppDay } | null;

function buildMonths(days: KppDay[]) {
  const byKey = new Map<string, KppDay>();
  const months = new Set<number>();
  for (const d of days) {
    const [dd, mm] = d.date.split(".").map(Number);
    byKey.set(`${mm}-${dd}`, d);
    months.add(mm);
  }
  return Array.from(months)
    .sort((a, b) => a - b)
    .map((m) => {
      const daysInMonth = new Date(YEAR, m, 0).getDate();
      const firstWeekday = (new Date(YEAR, m - 1, 1).getDay() + 6) % 7; // Monday = 0
      const cells: MonthCell[] = [];
      for (let i = 0; i < firstWeekday; i++) cells.push(null);
      for (let day = 1; day <= daysInMonth; day++) cells.push({ day, d: byKey.get(`${m}-${day}`) });
      return { month: m, cells };
    });
}

function Kpp() {
  const notes = useSmena((s) => s.notes);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [f, setF] = useState<(typeof filters)[number]>("рядом");
  const [selected, setSelected] = useState(project.dateIso ? "10.07" : kpp[0]?.date);
  const near = new Set(["01.07", "02.07", "03.07", "04.07", "05.07", "06.07", "07.07", "08.07", "09.07", "10.07", "11.07"]);
  const list = kpp.filter((d) => {
    if (f === "все") return true;
    if (f === "рядом") return near.has(d.date);
    return d.n != null;
  });
  const months = useMemo(() => buildMonths(kpp), []);
  const selectedDay = kpp.find((d) => d.date === selected);

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-start justify-between gap-3">
        <Link to="/more" className="text-sm font-semibold text-accent">
          ← ещё
        </Link>
        <button onClick={exportKpp} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
          <Download className="size-3.5" /> .csv
        </button>
      </div>
      <h1 className="mt-3 font-display text-3xl">КПП</h1>
      <p className="mb-3 text-sm text-muted">{project.title} · 1-я группа · 15.04–11.07 · 53 смены</p>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-semibold",
            view === "list" ? "bg-accent text-bg" : "border border-line bg-card text-muted",
          )}
        >
          <List className="size-4" /> Список
        </button>
        <button
          onClick={() => setView("calendar")}
          className={cn(
            "flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-semibold",
            view === "calendar" ? "bg-accent text-bg" : "border border-line bg-card text-muted",
          )}
        >
          <CalendarDays className="size-4" /> Календарь
        </button>
      </div>

      {view === "list" ? (
        <>
          <div className="mb-3 flex gap-2">
            {filters.map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={cn(
                  "min-h-10 flex-1 rounded-md text-sm font-semibold",
                  f === x ? "bg-accent text-bg" : "border border-line bg-card text-muted",
                )}
              >
                {x}
              </button>
            ))}
          </div>
          <ul className="rounded-lg border border-line bg-card">
            {list.map((d) => {
              const n = notes.filter((x) => x.day === d.date).length;
              return (
                <li key={d.date} className="flex gap-4 border-b border-line px-4 py-4 last:border-0">
                  <div className="w-14 shrink-0">
                    <div className="font-semibold">{d.date}</div>
                    <div className="text-xs text-faint">{d.n != null ? `смена ${d.n}` : "—"}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{d.loc}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", badge(d.status))}>
                        {d.status}
                        {d.night ? " · ночь" : ""}
                      </span>
                    </div>
                    <div className="text-sm text-muted">{d.scenes}</div>
                    {n > 0 && (
                      <Link to="/notes" className="mt-1 inline-block text-xs font-semibold text-accent">
                        {n} примеч.
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-accent" /> сегодня
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-warn" /> завтра
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-faint" /> снято
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full border border-line" /> выходной/подготовка
            </span>
          </div>
          <div className="flex flex-col gap-5">
            {months.map(({ month, cells }) => (
              <div key={month}>
                <h3 className="mb-2 text-sm font-semibold text-muted">
                  {MONTH_NAMES[month - 1]} {YEAR}
                </h3>
                <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-faint">
                  {WEEKDAYS.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((c, i) =>
                    c ? (
                      <button
                        key={i}
                        disabled={!c.d}
                        onClick={() => c.d && setSelected(c.d.date)}
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs font-semibold",
                          c.d ? badge(c.d.status) : "border-line text-faint",
                          selected === c.d?.date ? "border-accent" : "border-transparent",
                        )}
                      >
                        <span>{c.day}</span>
                        {c.d?.n != null && <span className="text-[9px] opacity-80">{c.d.n}</span>}
                      </button>
                    ) : (
                      <div key={i} />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedDay && (
            <div className="mt-4 rounded-lg border border-line bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {selectedDay.date} · {selectedDay.n != null ? `смена ${selectedDay.n}` : "нет смены"}
                  </div>
                  <div className="text-sm text-muted">{selectedDay.loc}</div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", badge(selectedDay.status))}>
                  {selectedDay.status}
                  {selectedDay.night ? " · ночь" : ""}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{selectedDay.scenes}</p>
              {notes.filter((x) => x.day === selectedDay.date).length > 0 && (
                <Link to="/notes" className="mt-2 inline-block text-xs font-semibold text-accent">
                  {notes.filter((x) => x.day === selectedDay.date).length} примеч. →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
