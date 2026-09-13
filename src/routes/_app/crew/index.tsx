import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { people } from "@/lib/seed";
import { useSmena } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app/crew/")({ component: Crew });

const labels: Record<string, string> = {
  unseen: "не видел",
  seen: "видел",
  going: "еду",
  "on-set": "на площадке",
};

function Crew() {
  const statuses = useSmena((s) => s.statuses);
  const depts = ["все", ...Array.from(new Set(people.map((p) => p.dept)))];
  const [dept, setDept] = useState("все");
  const list = dept === "все" ? people : people.filter((p) => p.dept === dept);

  return (
    <div className="flex flex-1 flex-col px-4 pt-8">
      <h1 className="px-1 font-display text-3xl">Группа</h1>
      <p className="mb-3 px-1 text-sm text-muted">{people.length} человек на проекте</p>
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold capitalize",
              dept === d ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <ul>
        {list.map((p) => (
          <li key={p.id} className="border-t border-line">
            <Link to="/crew/$id" params={{ id: p.id }} className="flex min-h-16 items-center gap-3 py-2">
              <div className="grid size-11 place-items-center rounded-md bg-accent-dim font-display text-accent">
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className="font-mono text-xs text-accent">{p.call}</span>
                </div>
                <div className="text-sm text-muted">
                  {p.role} · {labels[statuses[p.id] ?? p.status]}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
