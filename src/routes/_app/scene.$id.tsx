import { createFileRoute, Link } from "@tanstack/react-router";
import { blocks } from "@/lib/seed";
import { keysOf, objectsForScene } from "@/lib/objects";
import { libretto } from "@/lib/libretto";
import { useSmena } from "@/lib/store";

export const Route = createFileRoute("/_app/scene/$id")({ component: Scene });

function Scene() {
  const { id } = Route.useParams();
  const b = blocks.find((x) => x.id === id);
  const notes = useSmena((s) => s.notes);
  if (!b) {
    return (
      <div className="p-6">
        <p>Сцена не найдена.</p>
        <Link to="/" className="text-accent">
          Назад
        </Link>
      </div>
    );
  }
  const related = notes.filter((n) => b.scene && n.scene?.includes(b.scene));
  const lib = b.scene ? libretto.filter((s) => keysOf(b.scene!).includes(s.id)) : [];
  const locs = b.scene ? objectsForScene(b.scene) : [];
  return (
    <div className="px-5 pt-8 pb-6">
      <Link to="/" className="text-sm font-semibold text-accent">
        ← сегодня
      </Link>
      <p className="mt-4 font-mono text-sm text-accent tabular-nums">
        {b.start}–{b.end} · {b.dur}
      </p>
      <h1 className="mt-1 font-display text-3xl">
        {b.scene ? `${b.scene}. ` : ""}
        {b.heading}
      </h1>
      <p className="mt-2 text-muted">
        {b.loc} {b.dayType ? `· ${b.dayType}` : ""}
      </p>
      {lib.length > 0 && (
        <section className="mt-5 rounded-lg border border-line bg-card px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-accent uppercase">Либретто</div>
          {lib.slice(0, 3).map((s) => (
            <div key={s.id} className="mt-2">
              <div className="text-xs text-faint">
                {s.id} · {s.loc} · {s.dur}
              </div>
              <p className="text-sm leading-relaxed text-muted">{s.syn}</p>
            </div>
          ))}
        </section>
      )}
      {related.length > 0 && (
        <section className="mt-5 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-warn uppercase">Примечания к сцене</div>
          {related.map((n) => (
            <div key={n.id} className="mt-2">
              <div className="font-semibold">{n.title}</div>
              <p className="text-sm text-muted">{n.body}</p>
            </div>
          ))}
          <Link to="/notes" className="mt-2 inline-block text-xs font-semibold text-accent">
            открыть лист примечаний →
          </Link>
        </section>
      )}
      <dl className="mt-6 space-y-3 text-sm">
        {b.cast && (
          <div>
            <dt className="text-xs tracking-wide text-faint uppercase">Персонажи</dt>
            <dd>{b.cast.join(", ")}</dd>
          </div>
        )}
        {b.extras && (
          <div>
            <dt className="text-xs tracking-wide text-faint uppercase">Массовка</dt>
            <dd>{b.extras.join(", ")}</dd>
          </div>
        )}
        {b.props && (
          <div>
            <dt className="text-xs tracking-wide text-faint uppercase">Реквизит / транспорт</dt>
            <dd>{b.props}</dd>
          </div>
        )}
        {b.extraGear && (
          <div>
            <dt className="text-xs tracking-wide text-faint uppercase">Доп. ресурсы</dt>
            <dd>{b.extraGear}</dd>
          </div>
        )}
        {b.stunts && (
          <div>
            <dt className="text-xs tracking-wide text-faint uppercase">Каскад / сопровождение</dt>
            <dd>{b.stunts}</dd>
          </div>
        )}
        {b.note && (
          <div className="rounded-md border border-accent/30 bg-accent-dim px-3 py-2">
            <dt className="text-xs tracking-wide text-accent uppercase">Из вызывного</dt>
            <dd className="mt-1">{b.note}</dd>
          </div>
        )}
      </dl>
      {b.scene && (
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/chats/$id"
            params={{ id: `s${b.scene.replace(/-/g, "")}` }}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
          >
            Обсудить в треде сцены →
          </Link>
          {locs.map((o) => (
            <Link
              key={o.id}
              to="/objects/$id"
              params={{ id: o.id }}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
            >
              Объект · {o.name}
              {o.sub ? ` / ${o.sub}` : ""} →
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
