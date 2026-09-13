import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { people } from "@/lib/seed";
import { useSmena } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/crew/$id")({ component: Person });

const labels: Record<string, string> = {
  unseen: "не видел",
  seen: "видел",
  going: "еду",
  "on-set": "на площадке",
};

function Person() {
  const { id } = Route.useParams();
  const p = people.find((x) => x.id === id);
  const meId = useSmena((s) => s.meId);
  const setMe = useSmena((s) => s.setMe);
  const status = useSmena((s) => (p ? s.statuses[p.id] : "unseen"));

  if (!p) {
    return (
      <div className="p-6">
        <Link to="/crew" className="text-accent">
          ← группа
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <Link to="/crew" className="text-sm font-semibold text-accent">
        ← группа
      </Link>
      <h1 className="mt-4 font-display text-3xl">{p.name}</h1>
      <p className="text-muted">
        {p.role} · {p.dept}
      </p>
      <div className="mt-5 rounded-lg border border-line bg-card p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">вызов сегодня</span>
          <span className="font-mono text-lg">{p.call}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">статус</span>
          <span>{labels[status]}</span>
        </div>
        {p.phone && (
          <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="mt-3 block text-accent">
            {p.phone}
          </a>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button variant="line" onClick={() => toast(p.phone ? `Звонок: ${p.phone}` : "Номера нет в листе")}>
          Позвонить
        </Button>
        {meId !== p.id && (
          <Button
            variant="ghost"
            onClick={() => {
              setMe(p.id);
              toast("Смотришь площадку как " + p.name);
            }}
          >
            Войти как этот человек
          </Button>
        )}
      </div>
    </div>
  );
}
