import { createFileRoute, Link } from "@tanstack/react-router";
import { people, project } from "@/lib/seed";
import { useMe, useSmena } from "@/lib/store";

export const Route = createFileRoute("/_app/more")({ component: More });

function More() {
  const me = useMe();
  const setMe = useSmena((s) => s.setMe);

  return (
    <div className="px-5 pt-8 pb-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">штаб</p>
      <h1 className="font-display text-3xl">Ещё</h1>
      <p className="mt-1 mb-4 text-sm text-muted">
        Сейчас ты: {me.name}, {me.role}
      </p>
      <nav className="rounded-lg border border-line bg-card">
        <Link to="/floor" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Кто на площадке</div>
          <div className="text-sm text-muted">транспорт, актёры, группа · приехал / стоп / уехал</div>
        </Link>
        <Link to="/crew" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Список группы</div>
          <div className="text-sm text-muted">контакты, роли, цеха</div>
        </Link>
        <Link to="/menu" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Меню</div>
          <div className="text-sm text-muted">буфет и админка пишут группе в любой момент</div>
        </Link>
        <Link to="/notes" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Примечания</div>
          <div className="text-sm text-muted">правки вызывного, локации, каскад — отдельно от чатов</div>
        </Link>
        <Link to="/kpp" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">КПП</div>
          <div className="text-sm text-muted">смена {project.day} сегодня · 10.07 Хаапалампи, завтра отсыпной</div>
        </Link>
        <Link to="/script" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Сценарий</div>
          <div className="text-sm text-muted">сцены дня и либретто 8 серий</div>
        </Link>
        <Link to="/objects" className="block border-b border-line px-4 py-4">
          <div className="font-semibold">Объекты</div>
          <div className="text-sm text-muted">локации, подобъекты, сцены, кто в кадре</div>
        </Link>
        <Link to="/projects" className="block px-4 py-4">
          <div className="font-semibold">Проекты</div>
          <div className="text-sm text-muted">Община · смена 53</div>
        </Link>
      </nav>
      <section className="mt-4 rounded-lg border border-line bg-card p-4">
        <h2 className="font-semibold">Сменить роль</h2>
        <p className="mb-2 text-sm text-muted">Чтобы увидеть «сегодня» чужими глазами.</p>
        <select
          className="min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
          value={me.id}
          onChange={(e) => setMe(e.target.value)}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.role} — {p.name}
            </option>
          ))}
        </select>
      </section>
      <p className="mt-4 text-xs text-faint">
        Напоминания: вызов за 12 часов, правка дня сразу, «ты через 20 минут». Права на правку сценария выдают
        продюсер или второй режиссёр.
      </p>
    </div>
  );
}
