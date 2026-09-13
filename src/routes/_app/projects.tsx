import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects")({ component: Projects });

function Projects() {
  return (
    <div className="px-5 pt-8">
      <Link to="/more" className="text-sm font-semibold text-accent">
        ← ещё
      </Link>
      <h1 className="mt-3 font-display text-3xl">Проекты</h1>
      <Link to="/" className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-card p-4">
        <div className="grid size-12 place-items-center rounded-md bg-accent-dim font-display text-accent">Об</div>
        <div className="flex-1">
          <div className="font-semibold">Община</div>
          <div className="text-sm text-muted">смена 53 · Хаапалампи / Патанино</div>
        </div>
        <span className="text-xs text-ok">активен</span>
      </Link>
    </div>
  );
}
