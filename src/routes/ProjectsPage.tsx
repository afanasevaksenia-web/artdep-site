import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject, useMyProjects } from "../hooks/useProjects";
import { useActiveProject } from "../state/ActiveProjectContext";
import { useAuth } from "../state/AuthContext";
import { supabase } from "../lib/supabase";
import { DEPT_LABELS, DEPT_ORDER, type Dept } from "../lib/depts";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useMyProjects();
  const { setProjectId } = useActiveProject();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && projects && projects.length === 1) {
      setProjectId(projects[0].id);
      navigate(`/p/${projects[0].id}/today`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, projects]);

  function openProject(id: string) {
    setProjectId(id);
    navigate(`/p/${id}/today`);
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">Ваши проекты</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-muted underline"
          >
            Выйти
          </button>
        </div>

        {isLoading && <p className="text-muted">Загрузка…</p>}

        {!isLoading && projects && projects.length === 0 && (
          <p className="mb-4 text-sm text-muted">
            Проектов пока нет. Создайте свой — или войдите по ссылке-приглашению от вашей группы.
          </p>
        )}

        <ul className="mb-4 flex flex-col gap-2">
          {projects?.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => openProject(p.id)}
                className="flex min-h-tap w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-left"
              >
                <span>
                  <span className="block font-medium text-text">{p.name}</span>
                  <span className="block text-xs text-muted">
                    {p.role === "admin" ? "Админ" : "Участник"}
                  </span>
                </span>
                <span className="text-muted">→</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setWizardOpen(true)}
          className="min-h-tap w-full rounded-xl bg-accent px-4 font-medium text-white"
        >
          + Создать проект
        </button>

        <p className="mt-6 text-xs text-muted">
          Вошли как {session?.user.email}. Чтобы присоединиться к существующему проекту, откройте
          ссылку-приглашение вида /join/КОД, которую прислал админ группы.
        </p>
      </div>

      {wizardOpen && (
        <CreateProjectWizard
          onClose={() => setWizardOpen(false)}
          onDone={(id) => {
            setWizardOpen(false);
            setProjectId(id);
            navigate(`/p/${id}/today`);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectWizard({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const createProject = useCreateProject();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [dept, setDept] = useState<Dept | "">("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createAndAdvance() {
    setError(null);
    try {
      const project = await createProject.mutateAsync({ name: name.trim(), timezone, dept: dept || null });
      setProjectId((project as any).id);
      setStep(3);
    } catch (err: any) {
      setError(err.message ?? "Не удалось создать проект");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Новый проект — шаг {step} из 4</h2>
          <button onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Название проекта
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
                placeholder="Например, «Общинa»"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Часовой пояс
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
              />
            </label>
            <button
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Чем вы занимаетесь в этом проекте? Определяет, что вы увидите по умолчанию — можно изменить позже.</p>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as Dept)}
              className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
            >
              <option value="">Не выбирать сейчас</option>
              {DEPT_ORDER.map((d) => (
                <option key={d} value={d}>
                  {DEPT_LABELS[d]}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              disabled={createProject.isPending}
              onClick={createAndAdvance}
              className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-60"
            >
              {createProject.isPending ? "Создаём…" : "Создать проект и продолжить"}
            </button>
          </div>
        )}

        {step === 3 && projectId && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Пригласите группу — ссылки можно сгенерировать сейчас или позже, в разделе «Группа».
              Приглашения не одноразовые: они работают, пока их не отзовут.
            </p>
            <button
              onClick={() => setStep(4)}
              className="min-h-tap rounded-lg border border-border px-4 text-text"
            >
              Настрою приглашения позже, в «Группе»
            </button>
            <button
              onClick={() => setStep(4)}
              className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white"
            >
              Далее
            </button>
          </div>
        )}

        {step === 4 && projectId && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              КПП и вызывной можно загрузить из Excel-файлов вашей группы или вести прямо в
              приложении — оба пути равноценны.
            </p>
            <button
              onClick={() => {
                onDone(projectId);
              }}
              className="min-h-tap rounded-lg border border-border px-4 text-text"
            >
              Начать с пустого проекта
            </button>
            <button
              onClick={() => onDone(projectId)}
              className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white"
            >
              Готово — перейти в проект (импорт из Excel в разделе «Съёмка»)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
