import { createFileRoute, Link } from "@tanstack/react-router";
import { objects } from "@/lib/objects";
import { libretto } from "@/lib/libretto";

export const Route = createFileRoute("/_app/objects/$id")({ component: ObjectPage });

function ObjectPage() {
  const { id } = Route.useParams();
  const o = objects.find((x) => x.id === id);
  if (!o) {
    return (
      <div className="p-6">
        <Link to="/objects" className="text-accent">
          ← объекты
        </Link>
        <p className="mt-4">Объект не найден.</p>
      </div>
    );
  }
  const keys = o.scenes.split(",").map((s) => s.trim().split(" ")[0]).filter(Boolean);
  const related = libretto.filter((s) => keys.some((k) => s.id === k || s.id.startsWith(k) || k.startsWith(s.id)));

  return (
    <div className="px-5 pt-8 pb-6">
      <Link to="/objects" className="text-sm font-semibold text-accent">
        ← объекты
      </Link>
      <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">{o.group} · {o.intNat}</p>
      <h1 className="font-display text-3xl">{o.name}</h1>
      {o.sub ? <p className="text-muted">{o.sub}</p> : null}
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs tracking-wide text-accent uppercase">Сцены</dt>
          <dd className="mt-1">{o.scenes}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-accent uppercase">Хронометраж план</dt>
          <dd className="mt-1">{o.dur} · {o.scenesN} сцен</dd>
        </div>
        {o.cast ? (
          <div>
            <dt className="text-xs tracking-wide text-accent uppercase">Персонажи</dt>
            <dd className="mt-1">{o.cast}</dd>
          </div>
        ) : null}
      </dl>
      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl">Либретто</h2>
          {related.map((s) => (
            <article key={s.id} className="border-t border-line py-3">
              <div className="text-xs text-accent">
                {s.id} · {s.mode} · {s.dur}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.syn}</p>
              {s.cast ? <p className="mt-1 text-xs text-faint">{s.cast}</p> : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
