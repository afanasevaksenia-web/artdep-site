import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useActiveProject } from "../state/ActiveProjectContext";
import { useMyProjects } from "../hooks/useProjects";

export default function ProjectLayout() {
  const { projectId } = useParams();
  const { setProjectId } = useActiveProject();
  const { data: projects, isLoading } = useMyProjects();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) setProjectId(projectId);
  }, [projectId, setProjectId]);

  if (!isLoading && projects && projectId && !projects.some((p) => p.id === projectId)) {
    // проект не найден среди своих — либо ошиблись ссылкой, либо потеряли доступ
    return <Navigate to="/projects" replace />;
  }

  const current = projects?.find((p) => p.id === projectId);

  return (
    <div className="min-h-screen bg-bg pb-16">
      <header className="flex min-h-tap items-center justify-between border-b border-border bg-surface px-4">
        <span className="truncate font-medium text-text">{current?.name ?? "…"}</span>
        <button onClick={() => navigate("/projects")} className="text-sm text-accent">
          Сменить проект
        </button>
      </header>
      <main className="px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
