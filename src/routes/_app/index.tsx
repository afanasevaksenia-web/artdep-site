import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudRain, MapPin, Sunrise, Sunset } from "lucide-react";
import {
  blocks,
  floorCast,
  floorDepts,
  floorTransport,
  project,
  transportNotes,
} from "@/lib/seed";
import { isTodayObject, objects } from "@/lib/objects";
import { hereNames, missingNames } from "@/components/floor-board";
import { useMe, useSmena } from "@/lib/store";

export const Route = createFileRoute("/_app/")({ component: Today });

function Today() {
  const me = useMe();
  const notes = useSmena((s) => s.notes);
  const punch = useSmena((s) => s.punch);
  const lunch = useSmena((s) => s.lunch);
  const events = useSmena((s) => s.events);
  const menu = useSmena((s) => s.menu);
  const todayNotes = notes.filter((n) => n.day === "10.07");
  const tomorrowNotes = notes.filter((n) => n.day === "11.07");
  const allTasks = useSmena((s) => s.tasks);
  const tasks = allTasks.filter((t) => t.dept === me.dept && t.col !== "готово");
  const all = [...floorTransport, ...floorCast, ...floorDepts];
  const here = hereNames(all, punch);
  const missing = missingNames(all, punch);

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-8 pb-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
            {project.title} · смена {project.day}
          </p>
          <Link to="/callsheet" className="shrink-0 text-xs font-semibold text-accent">
            вызывной →
          </Link>
        </div>
        <h1 className="mt-1 font-display text-3xl tracking-tight">{project.dateLabel}</h1>
        <p className="mt-1 text-sm text-muted">
          {me.role} · вызов {me.call} · план стоп {project.stopMotor}
        </p>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <section className="rounded-lg border border-accent/25 bg-accent-dim px-4 py-4">
          <div className="text-xs font-semibold text-accent">Смена</div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs text-muted">мотор</div>
              <div className="font-display text-3xl tabular-nums">{project.motor}</div>
            </div>
            <div>
              <div className="text-xs text-muted">план стоп</div>
              <div className="font-display text-3xl tabular-nums">{project.stopMotor}</div>
            </div>
            <div>
              <div className="text-xs text-muted">{lunch === "отмена" ? "обед" : "обед сейчас"}</div>
              <div className={lunch === "отмена" ? "font-display text-xl text-warn" : "font-display text-xl tabular-nums"}>
                {lunch === "отмена" ? "отмена" : lunch}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Кто приехал и кто ещё в пути — вкладка «Площадка».</p>
        </section>

        <Link to="/board" className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Доска дня</h2>
            <span className="text-xs font-semibold text-accent">все события →</span>
          </div>
          {events.slice(0, 3).map((e) => (
            <div key={e.id} className="mt-2 border-t border-line/60 pt-2">
              <div className="text-xs font-semibold tracking-wide text-warn uppercase">
                {e.kind} · {e.t}
              </div>
              <div className="font-semibold">{e.title}</div>
            </div>
          ))}
        </Link>

        {menu[0] && (
          <Link to="/menu" className="rounded-lg border border-line bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Меню</h2>
              <span className="text-xs font-semibold text-accent">вывесить →</span>
            </div>
            <div className="mt-2 text-xs font-semibold tracking-wide text-accent uppercase">
              {menu[0].meal} · {menu[0].t} · {menu[0].who}
            </div>
            <p className="mt-1 line-clamp-3 text-sm text-muted">{menu[0].body}</p>
          </Link>
        )}

        <Link to="/floor" className="rounded-lg border border-line bg-card px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Кто на площадке</h2>
            <span className="text-xs font-semibold text-accent">табель →</span>
          </div>
          <p className="mt-2 text-sm text-ok">На месте · {here.length}</p>
          <p className="text-sm text-muted">{here.length ? here.slice(0, 6).join(", ") : "ещё никто не отметился"}</p>
          <p className="mt-2 text-sm text-warn">Нет · {missing.length}</p>
          <p className="text-sm text-muted">{missing.slice(0, 8).join(", ")}</p>
        </Link>

        <section className="rounded-lg border border-line bg-card px-4 py-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-xl">Примечания дня</h2>
            <Link to="/notes" className="text-xs font-semibold text-accent">
              весь лист →
            </Link>
          </div>
          {todayNotes.map((n) => (
            <Link key={n.id} to="/notes" className="block border-t border-line py-2.5">
              <div className="text-xs font-semibold tracking-wide text-warn uppercase">{n.kind}</div>
              <div className="font-semibold">{n.title}</div>
              <p className="line-clamp-2 text-sm text-muted">{n.body}</p>
            </Link>
          ))}
          {tomorrowNotes.length > 0 && (
            <Link to="/notes" className="block border-t border-line py-2.5">
              <div className="text-xs font-semibold tracking-wide text-info uppercase">завтра 11.07</div>
              <div className="font-semibold">{tomorrowNotes[0].title}</div>
              <p className="line-clamp-2 text-sm text-muted">{tomorrowNotes[0].body}</p>
            </Link>
          )}
        </section>

        <Link to="/objects" className="rounded-lg border border-line bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Объекты дня</h2>
            <span className="text-xs font-semibold text-accent">все 238 →</span>
          </div>
          {objects
            .filter(isTodayObject)
            .slice(0, 5)
            .map((o) => (
              <div key={o.id} className="mt-2 border-t border-line pt-2">
                <div className="font-semibold">
                  {o.name}
                  {o.sub ? <span className="font-normal text-muted"> · {o.sub}</span> : null}
                </div>
                <p className="text-xs text-faint">{o.scenes}</p>
              </div>
            ))}
        </Link>

        <section className="rounded-lg border border-line bg-card px-4 py-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 text-accent" />
            <div>
              <div className="font-semibold">Площадка</div>
              <p className="text-sm text-muted">{project.location}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
              <CloudRain className="size-3.5" /> {project.weather}
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
              <Sunrise className="size-3.5" /> {project.sunrise}
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border border-line px-2 py-1">
              <Sunset className="size-3.5" /> {project.sunset}
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-card px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-xl">План дня</h2>
            <span className="text-xs text-faint">тайминг</span>
          </div>
          <ol className="flex flex-col">
            {blocks.map((b) =>
              b.kind === "scene" ? (
                <li key={b.id}>
                  <Link to="/scene/$id" params={{ id: b.id }} className="flex gap-3 border-t border-line py-3">
                    <div className="w-14 shrink-0 font-mono text-xs text-accent tabular-nums">
                      {b.start}
                      <div className="text-faint">{b.end}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {b.scene}. {b.heading}
                      </div>
                      <div className="text-sm text-muted">
                        {b.loc} · {b.dayType}
                      </div>
                    </div>
                  </Link>
                </li>
              ) : (
                <li key={b.id} className="flex gap-3 border-t border-line py-2.5">
                  <div className="w-14 shrink-0 font-mono text-xs text-faint tabular-nums">{b.start}</div>
                  <div className="text-sm text-muted">{b.heading}</div>
                </li>
              ),
            )}
          </ol>
        </section>

        {tasks.length > 0 && (
          <section className="rounded-lg border border-line bg-card px-4 py-3">
            <h2 className="mb-2 font-display text-xl">Тебе на смену</h2>
            {tasks.map((t) => (
              <div key={t.id} className="border-t border-line py-2.5">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted">
                  {t.col} · сцена {t.scene}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-lg border border-line bg-card px-4 py-3">
          <h2 className="mb-2 font-display text-xl">Сбор и транспорт</h2>
          {transportNotes.map((n) => (
            <p key={n} className="border-t border-line py-2 text-sm text-muted">
              {n}
            </p>
          ))}
        </section>
      </div>
    </div>
  );
}
