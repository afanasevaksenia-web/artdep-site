import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Phone } from "lucide-react";
import { people } from "@/lib/seed";
import { useSmena } from "@/lib/store";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_app/crew/")({ component: Crew });

const labels: Record<string, string> = {
  unseen: "не видел",
  seen: "видел",
  going: "еду",
  "on-set": "на площадке",
};

function exportCrew() {
  downloadCsv(
    "gruppa-obshina.csv",
    ["Имя", "Роль", "Цех", "Вызов", "Телефон"],
    people.map((p) => [p.name, p.role, p.dept, p.call, p.phone ?? ""]),
  );
  toast("Список группы выгружен в CSV");
}

function Crew() {
  const statuses = useSmena((s) => s.statuses);
  const depts = ["все", ...Array.from(new Set(people.map((p) => p.dept)))];
  const [dept, setDept] = useState("все");
  const list = dept === "все" ? people : people.filter((p) => p.dept === dept);

  return (
    <div className="flex flex-1 flex-col px-4 pt-8">
      <div className="flex items-start justify-between gap-3 px-1">
        <h1 className="font-display text-3xl">Группа</h1>
        <button onClick={exportCrew} className="mt-2 flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
          <Download className="size-3.5" /> .csv
        </button>
      </div>
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
          <li key={p.id} className="flex items-center gap-1 border-t border-line">
            <Link to="/crew/$id" params={{ id: p.id }} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2">
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-dim font-display text-accent">
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
            {p.phone && (
              <a
                href={`tel:${p.phone.replace(/\s/g, "")}`}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-accent"
                aria-label={`Позвонить ${p.name}`}
              >
                <Phone className="size-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
