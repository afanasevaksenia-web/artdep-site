import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { MenuMeal } from "@/lib/seed";
import { useMe, useSmena } from "@/lib/store";

export const Route = createFileRoute("/_app/menu")({ component: Menu });

const meals: MenuMeal[] = ["завтрак", "обед", "перекус", "ночь", "разнос"];

function Menu() {
  const me = useMe();
  const menu = useSmena((s) => s.menu);
  const addMenu = useSmena((s) => s.addMenu);
  const canWrite = me.dept === "АХЧ" || me.role === "Администратор" || me.role === "Буфет" || me.id === "ad2";
  const [meal, setMeal] = useState<MenuMeal>("обед");
  const [body, setBody] = useState("");

  return (
    <div className="px-5 pt-8 pb-6">
      <Link to="/" className="text-sm font-semibold text-accent">
        ← сегодня
      </Link>
      <h1 className="mt-3 font-display text-3xl">Меню</h1>
      <p className="mb-4 text-sm text-muted">Пишет буфет или админка в любой момент. Группа видит сразу.</p>

      <form
        className="mb-4 rounded-lg border border-line bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          addMenu({ meal, body: body.trim() });
          setBody("");
          toast("Меню вывешено группе");
        }}
      >
        <p className="mb-2 text-xs text-muted">
          {canWrite ? `Пишешь как ${me.role}` : `Сейчас ты ${me.role}. Вывесить всё равно можно — на площадке так быстрее.`}
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {meals.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMeal(m)}
              className={cn(
                "min-h-10 rounded-full border px-3 text-sm font-semibold",
                meal === m ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Что едят, во сколько, аллергии, вегетарианское, где стол"
          rows={4}
          className="mb-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <Button type="submit" className="w-full">
          Вывесить меню
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {menu.map((p) => (
          <li key={p.id} className="rounded-lg border border-line bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-accent uppercase">{p.meal}</span>
              <span className="text-xs text-faint">
                {p.who} · {p.t}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
