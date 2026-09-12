import { lazy, Suspense, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMyProjects } from "../../hooks/useProjects";
import { useShifts } from "../../hooks/useShifts";
import {
  useDeleteScene,
  useMoveScene,
  useScenes,
  useSetSceneStatus,
  useUpsertScene,
  type Scene,
  type SceneStatus,
} from "../../hooks/useScenes";
import { SCENE_STATUS_LABELS } from "../../lib/depts";
import HistoryPanel from "../../components/HistoryPanel";

// xlsx — тяжёлая библиотека, нужна только при импорте; не тащим её в основной бандл.
const ImportExcelDialog = lazy(() => import("./ImportExcelDialog"));

const STATUS_ORDER: SceneStatus[] = ["planned", "shot", "partial", "moved", "cut"];

export default function KppTab() {
  const { projectId } = useParams();
  const { data: projects } = useMyProjects();
  const isAdmin = projects?.find((p) => p.id === projectId)?.role === "admin";
  const { data: scenes, isLoading } = useScenes(projectId ?? null);
  const { data: shifts } = useShifts(projectId ?? null);
  const [importOpen, setImportOpen] = useState(false);
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string | "unplanned", Scene[]>();
    for (const s of scenes ?? []) {
      const key = s.shift_id ?? "unplanned";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [scenes]);

  const shiftOrder = [...(shifts ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { key: string; title: string }[] = [
    ...shiftOrder.map((s) => ({
      key: s.id,
      title: `${new Date(s.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}${s.number ? ` · смена №${s.number}` : ""}`,
    })),
    { key: "unplanned", title: "Неспланированные" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="min-h-tap flex-1 rounded-lg border border-border text-text">
            Импорт из Excel
          </button>
          <button onClick={() => setAddingFor("unplanned")} className="min-h-tap flex-1 rounded-lg bg-accent font-medium text-white">
            + Сцена вручную
          </button>
        </div>
      )}

      {isLoading && <p className="text-muted">Загрузка…</p>}

      {groups.map((g) => {
        const list = grouped.get(g.key as any) ?? [];
        if (list.length === 0 && g.key !== "unplanned") return null;
        return (
          <div key={g.key}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{g.title}</h2>
            <div className="flex flex-col gap-2">
              {list.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isAdmin={!!isAdmin}
                  projectId={projectId!}
                  shifts={shiftOrder}
                />
              ))}
              {list.length === 0 && <p className="text-sm text-muted">Пусто</p>}
            </div>
          </div>
        );
      })}

      {addingFor && (
        <NewSceneForm
          projectId={projectId!}
          onClose={() => setAddingFor(null)}
        />
      )}

      {importOpen && projectId && (
        <Suspense fallback={null}>
          <ImportExcelDialog projectId={projectId} onClose={() => setImportOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function SceneCard({
  scene,
  isAdmin,
  projectId,
  shifts,
}: {
  scene: Scene;
  isAdmin: boolean;
  projectId: string;
  shifts: { id: string; date: string; number: number | null }[];
}) {
  const [editing, setEditing] = useState(false);
  const moveScene = useMoveScene(projectId);
  const setStatus = useSetSceneStatus(projectId);
  const deleteScene = useDeleteScene(projectId);
  const upsertScene = useUpsertScene(projectId);

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text">
            Сцена {scene.number} {scene.int_ext ? `· ${scene.int_ext}` : ""} {scene.story_day ? `· ${scene.story_day}` : ""}
          </p>
          {scene.location && <p className="text-sm text-text">{scene.location}{scene.sub_location ? ` / ${scene.sub_location}` : ""}</p>}
          {scene.synopsis && <p className="mt-1 text-sm text-muted">{scene.synopsis}</p>}
          {scene.characters && <p className="mt-1 text-xs text-muted">Персонажи: {scene.characters}</p>}
        </div>
        <StatusBadge status={scene.status} />
      </div>

      {isAdmin && (
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={scene.shift_id ?? ""}
            onChange={(e) => moveScene.mutate({ sceneId: scene.id, shiftId: e.target.value || null })}
            className="min-h-tap rounded-lg border border-border bg-bg px-2 text-sm text-text"
          >
            <option value="">Неспланированная</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                {s.number ? ` · №${s.number}` : ""}
              </option>
            ))}
          </select>
          <select
            value={scene.status}
            onChange={(e) => setStatus.mutate({ sceneId: scene.id, status: e.target.value as SceneStatus })}
            className="min-h-tap rounded-lg border border-border bg-bg px-2 text-sm text-text"
          >
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {SCENE_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
          <button onClick={() => setEditing((v) => !v)} className="min-h-tap rounded-lg border border-border px-3 text-sm text-text">
            {editing ? "Свернуть" : "Править"}
          </button>
          <button
            onClick={() => confirm("Удалить сцену?") && deleteScene.mutate(scene.id)}
            className="min-h-tap rounded-lg border border-danger px-3 text-sm text-danger"
          >
            Удалить
          </button>
        </div>
      )}

      {editing && (
        <SceneEditForm
          scene={scene}
          onSave={(patch) => {
            upsertScene.mutate({ id: scene.id, ...patch });
            setEditing(false);
          }}
        />
      )}

      <HistoryPanel projectId={projectId} tableName="scenes" rowId={scene.id} invalidateKeys={[["scenes", projectId]]} />
    </div>
  );
}

function StatusBadge({ status }: { status: SceneStatus }) {
  const styles: Record<SceneStatus, string> = {
    planned: "bg-border text-text",
    shot: "bg-dept-oper text-text",
    partial: "bg-dept-svet text-text",
    moved: "bg-dept-rezh text-text",
    cut: "bg-danger/20 text-danger",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>{SCENE_STATUS_LABELS[status]}</span>;
}

function SceneEditForm({ scene, onSave }: { scene: Scene; onSave: (patch: Partial<Scene>) => void }) {
  const [form, setForm] = useState({
    number: scene.number,
    int_ext: scene.int_ext ?? "",
    story_day: scene.story_day ?? "",
    location: scene.location ?? "",
    sub_location: scene.sub_location ?? "",
    synopsis: scene.synopsis ?? "",
    characters: scene.characters ?? "",
    costume_makeup: scene.costume_makeup ?? "",
    props: scene.props ?? "",
    stunts: scene.stunts ?? "",
  });

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      {Object.entries({
        number: "Номер сцены",
        int_ext: "Инт/Нат",
        story_day: "Сцен.день",
        location: "Объект",
        sub_location: "Подобъект",
        synopsis: "Синопсис",
        characters: "Персонажи",
        costume_makeup: "Костюм/Грим",
        props: "Реквизит",
        stunts: "Трюк/Каскадёры",
      }).map(([key, label]) => (
        <label key={key} className="flex flex-col gap-1 text-xs text-muted">
          {label}
          <input
            value={(form as any)[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="min-h-tap rounded-lg border border-border bg-bg px-2 text-sm text-text"
          />
        </label>
      ))}
      <button onClick={() => onSave(form)} className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white">
        Сохранить
      </button>
    </div>
  );
}

function NewSceneForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const upsertScene = useUpsertScene(projectId);
  const [number, setNumber] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Новая сцена</h2>
          <button onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Номер сцены
            <input value={number} onChange={(e) => setNumber(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Объект
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            disabled={saving || !number.trim()}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                await upsertScene.mutateAsync({ number: number.trim(), location: location.trim() || null });
                onClose();
              } catch (err: any) {
                setError(err.message ?? "Не удалось сохранить — возможно, такой номер сцены уже есть");
              } finally {
                setSaving(false);
              }
            }}
            className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-60"
          >
            {saving ? "Сохраняем…" : "Добавить сцену"}
          </button>
        </div>
      </div>
    </div>
  );
}
