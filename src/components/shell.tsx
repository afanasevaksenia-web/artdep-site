import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, MapPin, MessageSquare, MoreHorizontal, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { Toaster } from "sonner";
import { useSmena } from "@/lib/store";

const tabs = [
  { to: "/", label: "Сегодня", icon: Sun },
  { to: "/floor", label: "Площадка", icon: MapPin },
  { to: "/chats", label: "Чаты", icon: MessageSquare },
  { to: "/board", label: "Доска", icon: LayoutGrid },
  { to: "/more", label: "Ещё", icon: MoreHorizontal },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const chats = useSmena((s) => s.chats);
  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const thread = pathname.startsWith("/chats/") && pathname !== "/chats/";

  return (
    <div className="min-h-dvh bg-bg text-fg print:min-h-0">
      <div className="mx-auto flex h-dvh max-w-lg flex-col border-x border-line/60 bg-bg lg:max-w-xl print:h-auto print:max-w-none print:border-0">
        <div
          className={cn(
            "min-h-0 flex-1 print:overflow-visible",
            thread ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
        >
          <Outlet />
        </div>
        <nav className="mx-3 mb-3 grid shrink-0 grid-cols-5 rounded-lg border border-line bg-surface px-1 py-1 print:hidden">
          {tabs.map((t) => {
            const active =
              t.to === "/"
                ? pathname === "/" ||
                  pathname.startsWith("/scene") ||
                  pathname.startsWith("/notes") ||
                  pathname.startsWith("/menu")
                : t.to === "/more"
                  ? pathname.startsWith("/more") ||
                    pathname.startsWith("/objects") ||
                    pathname.startsWith("/script") ||
                    pathname.startsWith("/kpp") ||
                    pathname.startsWith("/crew") ||
                    pathname.startsWith("/projects") ||
                    pathname.startsWith("/callsheet")
                  : pathname === t.to || pathname.startsWith(`${t.to}/`);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-semibold",
                  active ? "text-accent" : "text-faint",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {t.label}
                {t.to === "/chats" && unread > 0 && (
                  <span className="absolute top-1 right-3 grid min-w-4 place-items-center rounded-full bg-warn px-1 text-xs font-bold text-fg">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
