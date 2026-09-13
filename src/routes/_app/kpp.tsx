import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { kpp, project } from "@/lib/seed";
import { cn } from "@/lib/cn";
import { useSmena } from "@/lib/store";
import type { KppStatus } from "@/lib/kpp-data";

export const Route = createFileRoute("/_app/kpp")({ component: Kpp });

const filters = ["рядом", "съёмки", "все"] as const;

function Kpp() {
  const notes = useSmena((s) => s.notes);
  const [f, setF] = useState<(typeof filters)[number]>("рядом");
  const near = new Set(["01.07", "02.07", "03.07", "04.07", "05.07", "06.07", "07.07", "08.07", "09.07", "10.07", "11.07"]);
  const list = kpp.filter((d) => {
    if (f === "все") return true;
    if (f === "рядом") return near.has(d.date);
    return d.n != null;
  });

  return (
    <div className="px-5 pt-8 pb-4">
      <Link to="/more" className="text-sm font-semibold text-accent">
        ← ещё
      </Link>
      <h1 className="mt-3 font-display text-3xl">КПП</h1>
      <p className="mb-3 text-sm text-muted">{project.title} · 1-я группа · 15.04–11.07 · 53 смены</p>
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
    </div>
  );
}

function badge(s: KppStatus) {
  if (s === "сегодня") return "bg-accent-dim text-accent";
  if (s === "завтра") return "bg-warn/20 text-warn";
  if (s === "снято") return "bg-surface text-faint";
  if (s === "отсыпной" || s === "выходной" || s === "подготовка") return "bg-surface text-muted";
  return "bg-surface text-muted";
}
