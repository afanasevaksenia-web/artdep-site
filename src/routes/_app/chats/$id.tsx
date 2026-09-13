import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { people } from "@/lib/seed";
import { useSmena } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app/chats/$id")({ component: Chat });

const quick = ["Принято", "На площадке", "Ждём", "Снято"];

function Chat() {
  const { id } = Route.useParams();
  const chats = useSmena((s) => s.chats);
  const messages = useSmena((s) => s.messages);
  const chat = chats.find((c) => c.id === id);
  const msgs = messages[id] ?? [];
  const send = useSmena((s) => s.send);
  const readChat = useSmena((s) => s.readChat);
  const addEvent = useSmena((s) => s.addEvent);
  const [text, setText] = useState("");
  const [call, setCall] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readChat(id);
  }, [id, readChat]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  if (!chat) {
    return (
      <div className="p-6">
        <Link to="/chats" className="text-accent">
          ← чаты
        </Link>
        <p className="mt-4">Чат не найден.</p>
      </div>
    );
  }

  const roster =
    chat.kind === "Общий"
      ? people.filter((p) => p.dept === "Площадка" || p.role === "Администратор")
      : chat.dept
        ? people.filter((p) => p.dept === chat.dept)
        : people.filter((p) => p.dept === "Площадка" || p.dept === "Режиссура");

  function post(v: string, shot?: string) {
    const t = v.trim();
    if (!t && !shot) return;
    send(id, t, shot);
    setText("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 pt-8 pb-3">
        <Link to="/chats" className="text-sm font-semibold text-accent">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{chat.name}</div>
          <div className="text-xs text-faint">{chat.kind} · не телеграм</div>
        </div>
        <button
          className="grid size-11 place-items-center rounded-md border border-line"
          onClick={() => setCall((v) => !v)}
          aria-label="Позвонить"
        >
          <Phone className="size-4" />
        </button>
      </header>

      {call && (
        <div className="shrink-0 border-y border-line bg-card px-4 py-2">
          <p className="mb-1 text-xs text-muted">Кому звонить из этого чата</p>
          {roster.map((p) =>
            p.phone ? (
              <a key={p.id} href={`tel:${p.phone}`} className="flex min-h-11 items-center justify-between border-t border-line text-sm">
                <span>
                  {p.name} · {p.role}
                </span>
                <span className="text-accent">{p.phone}</span>
              </a>
            ) : (
              <div key={p.id} className="flex min-h-11 items-center justify-between border-t border-line text-sm">
                <span>
                  {p.name} · {p.role}
                </span>
                <span className="text-faint">нет номера</span>
              </div>
            ),
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              m.me ? "ml-10 self-end border border-accent/30 bg-accent-dim" : "mr-10 self-start border border-line bg-card",
            )}
          >
            {!m.me && <div className="mb-0.5 text-xs font-semibold text-accent">{m.who}</div>}
            <p>{m.text}</p>
            {m.link && (
              <a
                href={m.link.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-md border border-line bg-surface px-3 py-2 text-xs text-accent"
              >
                {m.link.label}
              </a>
            )}
            {m.shot && (
              <div className="mt-2 rounded-md border border-line bg-surface px-3 py-6 text-center text-xs text-muted">
                {m.shot}
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs text-faint">{m.t}</span>
              <button
                className="text-xs font-semibold text-accent"
                onClick={() => {
                  addEvent({ kind: "другое", title: m.text.slice(0, 72), body: `из чата «${chat.name}», ${m.who}` });
                  toast("Вынесено на доску дня");
                }}
              >
                на доску
              </button>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div className="mb-2 flex gap-1 overflow-x-auto">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => post(q)}
              className="min-h-9 shrink-0 rounded-full border border-line px-3 text-xs font-semibold text-muted"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            post(text);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="В цех или к сцене…"
            className="min-h-11 flex-1 rounded-md border border-line bg-card px-3 text-sm text-fg outline-none placeholder:text-faint"
          />
          <Button
            type="button"
            variant="line"
            onClick={() => post(text || "кадр с площадки", "кадр · " + (text || "без подписи"))}
          >
            Кадр
          </Button>
          <Button type="submit">Ок</Button>
        </form>
      </div>
    </div>
  );
}
