import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMe, useSmena } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { Chat } from "@/lib/seed";

export const Route = createFileRoute("/_app/chats/")({ component: Chats });

const filters = ["все", "мой цех", "сцены", "общий"] as const;

function match(c: Chat, f: (typeof filters)[number], dept: string) {
  if (f === "все") return true;
  if (f === "общий") return c.kind === "Общий";
  if (f === "сцены") return c.kind === "Сцена";
  return c.kind === "Цех" && c.dept === dept;
}

function Chats() {
  const me = useMe();
  const chats = useSmena((s) => s.chats);
  const [f, setF] = useState<(typeof filters)[number]>("все");
  const list = chats
    .filter((c) => match(c, f, me.dept))
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.unread - a.unread);

  return (
    <div className="flex flex-1 flex-col px-5 pt-8 pb-2">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">работа здесь, не в телеге</p>
      <h1 className="font-display text-3xl">Чаты</h1>
      <p className="mt-1 mb-3 text-sm text-muted">Общий — объявления. Цех — своё. Сцена — только этот кадр.</p>
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {filters.map((x) => (
          <button
            key={x}
            onClick={() => setF(x)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold",
              f === x ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
            )}
          >
            {x}
          </button>
        ))}
      </div>
      <ul className="flex flex-col">
        {list.map((c) => (
          <li key={c.id} className="border-t border-line">
            <Link to="/chats/$id" params={{ id: c.id }} className="flex min-h-16 items-center gap-3 py-3">
              <div className="grid size-11 place-items-center rounded-md bg-accent-dim font-display text-lg text-accent">
                {c.kind === "Сцена" ? c.name.replace("Сцена ", "").slice(0, 3) : c.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-faint">{c.kind}</span>
                </div>
                <p className="truncate text-sm text-muted">{c.last}</p>
              </div>
              {c.unread > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-warn px-1.5 text-xs font-bold text-fg">
                  {c.unread}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
