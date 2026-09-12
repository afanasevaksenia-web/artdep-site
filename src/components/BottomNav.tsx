import { NavLink, useParams } from "react-router-dom";

const TABS = [
  { to: "today", label: "Сегодня" },
  { to: "chats", label: "Чаты" },
  { to: "shoot", label: "Съёмка" },
  { to: "files", label: "Файлы" },
  { to: "group", label: "Группа" },
];

export default function BottomNav() {
  const { projectId } = useParams();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={`/p/${projectId}/${tab.to}`}
          className={({ isActive }) =>
            `flex min-h-tap flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              isActive ? "font-semibold text-accent" : "text-muted"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
