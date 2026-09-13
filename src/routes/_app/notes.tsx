import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useSmena } from "@/lib/store";
import type { DayNote } from "@/lib/seed";

export const Route = createFileRoute("/_app/notes")({ component: Notes });

const kinds: DayNote["kind"][] = ["правка", "каскад", "площадка", "локация", "цех"];
const days = ["10.07", "11.07", "07.07"];

function Notes() {
  const notes = useSmena((s) => s.notes);
  const addNote = useSmena((s) => s.addNote);
  const [day, setDay] = useState("10.07");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", kind: "правка" as DayNote["kind"], scene: "" });
  const list = notes.filter((n) => n.day === day);

  return (
    <div className="px-5 pt-8 pb-6">
      <Link to="/" className="text-sm font-semibold text-accent">
        ← сегодня
      </Link>
      <h1 className="mt-3 font-display text-3xl">Примечания</h1>
      <p className="mb-4 text-sm text-muted">Отдельный лист дня. Не чат — то, что должно попасть в вызывной.</p>

      <div className="mb-3 flex gap-2">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={cn(
              "min-h-10 rounded-full border px-3 text-sm font-semibold",
              day === d ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {list.map((n) => (
          <li key={n.id} className="rounded-lg border border-line bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-accent uppercase">{n.kind}</span>
              <span className="text-xs text-faint">
                {n.who} · {n.t}
              </span>
            </div>
            <h2 className="mt-1 font-semibold">{n.title}</h2>
            {n.scene && <div className="text-xs text-muted">сцены {n.scene}</div>}
            <p className="mt-2 text-sm leading-relaxed text-muted">{n.body}</p>
            {n.links?.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-md border border-line bg-surface px-3 py-2 text-xs text-accent"
              >
                {l.label}
              </a>
            ))}
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">На этот день пока пусто.</p>}
      </ul>

      {!open ? (
        <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
          Добавить примечание
        </Button>
      ) : (
        <form
          className="mt-4 rounded-lg border border-line bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.body.trim()) return;
            addNote({
              day,
              kind: form.kind,
              title: form.title.trim(),
              body: form.body.trim(),
              scene: form.scene.trim() || undefined,
            });
            setForm({ title: "", body: "", kind: "правка", scene: "" });
            setOpen(false);
            toast("Записано в примечания дня");
          }}
        >
          <p className="mb-2 text-xs text-muted">Попадёт в лист {day}, не в чат.</p>
          <div className="mb-2 flex flex-wrap gap-1">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm((f) => ({ ...f, kind: k }))}
                className={cn(
                  "min-h-9 rounded-full border px-3 text-xs font-semibold",
                  form.kind === k ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
                )}
              >
                {k}
              </button>
            ))}
          </div>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Заголовок"
            className="mb-2 min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
          />
          <input
            value={form.scene}
            onChange={(e) => setForm((f) => ({ ...f, scene: e.target.value }))}
            placeholder="Сцены, если есть — 1-2"
            className="mb-2 min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Текст примечания"
            rows={4}
            className="mb-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Записать
            </Button>
            <Button type="button" variant="line" onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
