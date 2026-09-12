import { NavLink, Outlet, useParams } from "react-router-dom";

export default function ShootLayout() {
  const { projectId } = useParams();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-xl border border-border bg-surface p-1">
        <NavLink
          to={`/p/${projectId}/shoot/shifts`}
          className={({ isActive }) =>
            `min-h-tap flex-1 rounded-lg text-center leading-[48px] ${isActive ? "bg-accent text-white" : "text-text"}`
          }
        >
          Смены
        </NavLink>
        <NavLink
          to={`/p/${projectId}/shoot/kpp`}
          className={({ isActive }) =>
            `min-h-tap flex-1 rounded-lg text-center leading-[48px] ${isActive ? "bg-accent text-white" : "text-text"}`
          }
        >
          КПП
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
