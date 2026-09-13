import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { isTodayObject, objectGroups, objects } from "@/lib/objects";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app/objects/")({ component: Objects });

function Objects() {
  const [q, setQ] = useState("");
  const [g, setG] = useState<(typeof objectGroups)[number]>("сегодня");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return objects.filter((o) => {
      if (g === "сегодня") {
        if (!isTodayObject(o)) return false;
      } else if (o.group !== g) return false;
      if (!query) return true;
      return `${o.name} ${o.sub} ${o.scenes} ${o.cast}`.toLowerCase().includes(query);
    });
  }, [q, g]);

  return (
    <div className="px-5 pt-8 pb-4">
      <Link to="/more" className="text-sm font-semibold text-accent">
        ← ещё
      </Link>
      <h1 className="mt-3 font-display text-3xl">Объекты</h1>
      <p className="mb-3 text-sm text-muted">238 локаций из списка 16.02 · сегодня — кладбище и Патанино</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="кладбище, Алина, 5-4…"
        className="mb-3 min-h-11 w-full rounded-md border border-line bg-card px-3 text-sm outline-none placeholder:text-faint"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {objectGroups.map((x) => (
          <button
            key={x}
            onClick={() => setG(x)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold",
              g === x ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
            )}
          >
            {x}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-faint">{list.length} объектов</p>
      <ul className="rounded-lg border border-line bg-card">
        {list.map((o) => (
          <li key={o.id} className="border-b border-line last:border-0">
            <Link to="/objects/$id" params={{ id: o.id }} className="block min-h-16 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">
                  {o.name}
                  {o.sub ? <span className="font-normal text-muted"> · {o.sub}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-faint">{o.intNat}</span>
              </div>
              <p className="text-sm text-muted">
                {o.scenesN} сцен · {o.dur}
              </p>
              <p className="truncate text-xs text-faint">{o.scenes}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
