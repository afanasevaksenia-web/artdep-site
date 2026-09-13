import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { blocks, people, project, transportNotes, type Person } from "@/lib/seed";
import { useSmena } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/callsheet")({ component: CallSheet });

const TODAY = "10.07";

function groupByDept(list: Person[]) {
  const order: string[] = [];
  const map = new Map<string, Person[]>();
  for (const p of list) {
    if (!map.has(p.dept)) {
      map.set(p.dept, []);
      order.push(p.dept);
    }
    map.get(p.dept)!.push(p);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.call.localeCompare(b.call));
  return order.map((dept) => [dept, map.get(dept)!] as const);
}

function CallSheet() {
  const notes = useSmena((s) => s.notes);
  const lunch = useSmena((s) => s.lunch);
  const todayNotes = notes.filter((n) => n.day === TODAY);
  const crew = people.filter((p) => p.dept !== "Актёры");
  const cast = people
    .filter((p) => p.dept === "Актёры")
    .slice()
    .sort((a, b) => a.call.localeCompare(b.call));
  const crewGroups = groupByDept(crew);
  const lunchLabel = lunch === "отмена" ? "отмена" : lunch;

  function buildText() {
    const lines = [
      `${project.title} · смена ${project.day} · ${project.dateLabel}`,
      project.location,
      `Мотор ${project.motor} · план стоп ${project.stopMotor} · обед ${lunchLabel} · ${project.weather}`,
      "",
      "РАСПИСАНИЕ",
      ...blocks.map((b) => `${b.start}${b.end ? `–${b.end}` : ""} · ${b.heading}${b.loc ? ` · ${b.loc}` : ""}`),
      "",
      "ВЫЗОВЫ — ГРУППА",
      ...crewGroups.flatMap(([dept, list]) => [
        `${dept}:`,
        ...list.map((p) => `  ${p.call} ${p.name} — ${p.role}`),
      ]),
      "",
      "АКТЁРЫ",
      ...cast.map((p) => `  ${p.call} ${p.role} (${p.name})`),
    ];
    if (todayNotes.length) {
      lines.push("", "ПРИМЕЧАНИЯ", ...todayNotes.map((n) => `• ${n.title}: ${n.body}`));
    }
    lines.push("", "ТРАНСПОРТ", ...transportNotes.map((n) => `• ${n}`));
    return lines.join("\n");
  }

  async function share() {
    const text = buildText();
    const title = `Вызывной · ${project.title} смена ${project.day}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        return; // cancelled — not an error
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Вызывной скопирован в буфер обмена");
    } catch {
      toast("Не удалось скопировать — попробуй печать");
    }
  }

  return (
    <div className="px-5 pt-8 pb-10 print:px-0 print:pt-0">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/" className="text-sm font-semibold text-accent">
          ← сегодня
        </Link>
        <div className="flex gap-2">
          <Button variant="line" onClick={() => window.print()}>
            <Printer className="size-4" /> Печать
          </Button>
          <Button variant="line" onClick={share}>
            <Share2 className="size-4" /> Поделиться
          </Button>
        </div>
      </div>

      <header className="mt-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Вызывной</p>
        <h1 className="font-display text-3xl">
          {project.title} · смена {project.day}
        </h1>
        <p className="text-sm text-muted">
          {project.dateLabel} · {project.location}
        </p>
        <p className="mt-1 text-sm text-muted">
          Мотор {project.motor} · план стоп {project.stopMotor} · обед {lunchLabel} · {project.weather}
        </p>
      </header>

      <section className="mt-5">
        <h2 className="mb-2 font-display text-xl">Расписание</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="py-1.5 pr-3 align-top font-mono text-xs text-accent tabular-nums">
                  {b.start}
                  {b.end ? `–${b.end}` : ""}
                </td>
                <td className="py-1.5">
                  <span className="font-semibold">{b.heading}</span>
                  {b.loc ? <span className="text-muted"> · {b.loc}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 font-display text-xl">Вызовы — группа</h2>
        {crewGroups.map(([dept, list]) => (
          <div key={dept} className="mb-3">
            <h3 className="text-xs font-semibold tracking-wide text-accent uppercase">{dept}</h3>
            <ul>
              {list.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 border-t border-line py-1.5 text-sm">
                  <span className="min-w-0">
                    {p.name} <span className="text-muted">— {p.role}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="font-mono tabular-nums">{p.call}</span>
                    {p.phone && (
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="text-accent print:hidden">
                        звонок
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 font-display text-xl">Актёры</h2>
        <ul>
          {cast.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 border-t border-line py-1.5 text-sm">
              <span className="min-w-0">
                {p.role} <span className="text-muted">— {p.name}</span>
              </span>
              <span className="font-mono tabular-nums">{p.call}</span>
            </li>
          ))}
        </ul>
      </section>

      {todayNotes.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 font-display text-xl">Примечания</h2>
          <ul className="flex flex-col">
            {todayNotes.map((n) => (
              <li key={n.id} className="border-t border-line py-2 text-sm">
                <span className="font-semibold">{n.title}</span> — <span className="text-muted">{n.body}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h2 className="mb-2 font-display text-xl">Сбор и транспорт</h2>
        <ul>
          {transportNotes.map((n) => (
            <li key={n} className="border-t border-line py-1.5 text-sm text-muted">
              {n}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
