import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAcceptInvite } from "../hooks/useProjects";

export default function JoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const acceptInvite = useAcceptInvite();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    acceptInvite.mutate(code, {
      onSuccess: (projectId) => {
        setDone(true);
        setTimeout(() => navigate(`/p/${projectId}/today`, { replace: true }), 600);
      },
      onError: (err: any) => setError(err.message ?? "Не удалось принять приглашение"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-center">
      <div className="max-w-sm">
        {error ? (
          <>
            <p className="mb-2 text-lg font-semibold text-danger">Не получилось войти по ссылке</p>
            <p className="text-sm text-muted">{error}</p>
            <button
              onClick={() => navigate("/projects")}
              className="mt-4 min-h-tap rounded-lg bg-accent px-4 text-white"
            >
              К списку проектов
            </button>
          </>
        ) : done ? (
          <p className="text-text">Готово, переходим в проект…</p>
        ) : (
          <p className="text-muted">Принимаем приглашение…</p>
        )}
      </div>
    </div>
  );
}
