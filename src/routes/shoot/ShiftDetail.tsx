import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMyProjects } from "../../hooks/useProjects";
import {
  useDeleteShiftTiming,
  usePublishShift,
  useShiftTiming,
  useShifts,
  useUpsertShift,
  useUpsertShiftTiming,
} from "../../hooks/useShifts";
import HistoryPanel from "../../components/HistoryPanel";

export default function ShiftDetail() {
  const { projectId, shiftId } = useParams();
  const { data: projects } = useMyProjects();
  const isAdmin = projects?.find((p) => p.id === projectId)?.role === "admin";
  const { data: shifts } = useShifts(projectId ?? null);
  const shift = shifts?.find((s) => s.id === shiftId);
  const upsertShift = useUpsertShift(projectId!);
  const publishShift = usePublishShift(projectId!);
  const { data: timing } = useShiftTiming(shiftId ?? null);
  const upsertTiming = useUpsertShiftTiming(shiftId!);
  const deleteTiming = useDeleteShiftTiming(shiftId!);

  if (!shift) return <p className="text-muted">Загрузка…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-text">
            {new Date(shift.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
            {shift.number ? ` · смена №${shift.number}` : ""}
          </h1>
          {!shift.published && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">Черновик</span>}
        </div>

        {isAdmin ? (
          <EditableFields shift={shift} onSave={(patch) => upsertShift.mutate({ id: shift.id, ...patch })} />
        ) : (
          <div className="mt-2 text-sm text-text">
            <p>{shift.location}</p>
            <p>{shift.address}</p>
            <p className="text-muted">{shift.note}</p>
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => publishShift.mutate({ shiftId: shift.id, published: !shift.published })}
            className="mt-3 min-h-tap rounded-lg border border-border px-4 text-text"
          >
            {shift.published ? "Снять с публикации" : "Опубликовать"}
          </button>
        )}

        {projectId && <HistoryPanel projectId={projectId} tableName="shifts" rowId={shift.id} invalidateKeys={[["shifts", projectId]]} />}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-base font-semibold text-text">Тайминг</h2>
        <ul className="flex flex-col gap-2">
          {timing?.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
              <div>
                <p className="text-text">{t.label}</p>
                <p className="text-muted">
                  План: {t.plan_start ? new Date(t.plan_start).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  {" · "}Факт: {t.fact_start ? new Date(t.fact_start).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  {!t.fact_start ? (
                    <button
                      onClick={() => upsertTiming.mutate({ id: t.id, fact_start: new Date().toISOString() })}
                      className="min-h-tap rounded-lg border border-border px-3 text-xs text-text"
                    >
                      Начали
                    </button>
                  ) : !t.fact_end ? (
                    <button
                      onClick={() => upsertTiming.mutate({ id: t.id, fact_end: new Date().toISOString() })}
                      className="min-h-tap rounded-lg border border-border px-3 text-xs text-text"
                    >
                      Закончили
                    </button>
                  ) : (
                    <span className="text-xs text-muted">Готово</span>
                  )}
                  <button onClick={() => deleteTiming.mutate(t.id)} className="min-h-tap rounded-lg border border-danger px-2 text-xs text-danger">
                    ✕
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && <AddTimingRow onAdd={(label) => upsertTiming.mutate({ label })} />}
      </div>
    </div>
  );
}

function EditableFields({
  shift,
  onSave,
}: {
  shift: { location: string | null; address: string | null; note: string | null };
  onSave: (patch: { location: string; address: string; note: string }) => void;
}) {
  const [location, setLocation] = useState(shift.location ?? "");
  const [address, setAddress] = useState(shift.address ?? "");
  const [note, setNote] = useState(shift.note ?? "");

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onBlur={() => onSave({ location, address, note })}
        placeholder="Локация"
        className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onBlur={() => onSave({ location, address, note })}
        placeholder="Адрес"
        className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => onSave({ location, address, note })}
        placeholder="Заметка"
        className="rounded-lg border border-border bg-bg p-3 text-text"
      />
    </div>
  );
}

function AddTimingRow({ onAdd }: { onAdd: (label: string) => void }) {
  const [label, setLabel] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Сбор / Первый кадр / Обед / Конец…"
        className="min-h-tap flex-1 rounded-lg border border-border bg-bg px-3 text-text"
      />
      <button
        onClick={() => {
          if (!label.trim()) return;
          onAdd(label.trim());
          setLabel("");
        }}
        className="min-h-tap rounded-lg bg-accent px-4 text-white"
      >
        Добавить
      </button>
    </div>
  );
}
