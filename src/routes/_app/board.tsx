import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DayEvent, DayEventKind, Task } from "@/lib/seed";
import { useSmena } from "@/lib/store";

export const Route = createFileRoute("/_app/board")({ component: Board });

const kinds: DayEventKind[] = ["перенос", "замена", "обед", "погода", "стоп", "другое"];
const cols = ["к смене", "в работе", "готово", "блокер"] as const;

function Board() {
  const [tab, setTab] = useState<"day" | "tasks">("day");
  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="font-display text-3xl">Доска дня</h1>
      <p className="mb-3 text-sm text-muted">Перенос, замена сцен, обед, погода — чтобы группа видела сразу, не из рации.</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("day")}
          className={cn("min-h-11 rounded-md text-sm font-semibold", tab === "day" ? "bg-accent text-bg" : "border border-line bg-card")}
        >
          События
        </button>
        <button
          onClick={() => setTab("tasks")}
          className={cn("min-h-11 rounded-md text-sm font-semibold", tab === "tasks" ? "bg-accent text-bg" : "border border-line bg-card")}
        >
          Задания
        </button>
      </div>
      {tab === "day" ? <EventsPane /> : <TasksPane />}
    </div>
  );
}

function EventsPane() {
  const events = useSmena((s) => s.events);
  const addEvent = useSmena((s) => s.addEvent);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DayEventKind>("перенос");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function post(partial: Omit<DayEvent, "id" | "who" | "t">) {
    addEvent(partial);
    toast("На доске дня");
    setOpen(false);
    setTitle("");
    setBody("");
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant="line"
          onClick={() =>
            post({
              kind: "обед",
              title: "Обед отмена",
              body: "Обед снимаем. Работаем сквозным. Буфет на площадке.",
              lunch: "отмена",
            })
          }
        >
          Обед отмена
        </Button>
        <Button
          variant="line"
          onClick={() =>
            post({
              kind: "обед",
              title: "Обед раньше · 11:20",
              body: "Обед переносим на 11:20–12:20.",
              lunch: "11:20–12:20",
            })
          }
        >
          Обед раньше
        </Button>
        <Button variant="line" onClick={() => setOpen((v) => !v)}>
          Своё событие
        </Button>
      </div>

      {open && (
        <form
          className="mb-3 rounded-lg border border-line bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            post({ kind, title: title.trim(), body: body.trim() });
          }}
        >
          <div className="mb-2 flex flex-wrap gap-1">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "min-h-9 rounded-full border px-3 text-xs font-semibold",
                  kind === k ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
                )}
              >
                {k}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Что случилось — перенос 1-5, меняем 1-2 и 1-1"
            className="mb-2 min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Кому знать и что делать"
            rows={3}
            className="mb-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
          <Button type="submit" className="w-full">
            Вывесить
          </Button>
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {events.map((e) => (
          <li key={e.id} className="rounded-lg border border-line bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-warn uppercase">{e.kind}</span>
              <span className="font-mono text-xs text-faint tabular-nums">
                {e.t} · {e.who}
              </span>
            </div>
            <h2 className="mt-1 font-semibold">{e.title}</h2>
            <p className="mt-1 text-sm text-muted">{e.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function TasksPane() {
  const tasks = useSmena((s) => s.tasks);
  const move = useSmena((s) => s.moveTask);
  const depts = Array.from(new Set(tasks.map((t: Task) => t.dept)));
  const [dept, setDept] = useState(depts[0] ?? "");
  const list = tasks.filter((t) => t.dept === dept);

  return (
    <>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold",
              dept === d ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {cols.map((col) => {
          const items = list.filter((t) => t.col === col);
          return (
            <section key={col} className="w-60 shrink-0 rounded-lg border border-line bg-surface p-2">
              <h2 className="px-1 py-1 text-xs font-semibold tracking-wide text-muted uppercase">
                {col} · {items.length}
              </h2>
              {items.map((t) => (
                <button
                  key={t.id}
                  onClick={() => move(t.id)}
                  className="mb-2 w-full rounded-md border border-line bg-card p-3 text-left"
                >
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {t.scene} · {t.who}
                  </div>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
