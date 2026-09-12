import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMyProjects } from "../../hooks/useProjects";
import { useNotifyCallSheet, usePublishShift, useShifts, useUpsertShift } from "../../hooks/useShifts";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long", weekday: "short" });
}

export default function ShiftsTab() {
  const { projectId } = useParams();
  const { data: projects } = useMyProjects();
  const isAdmin = projects?.find((p) => p.id === projectId)?.role === "admin";
  const { data: shifts, isLoading } = useShifts(projectId ?? null);
  const upsertShift = useUpsertShift(projectId!);
  const publishShift = usePublishShift(projectId!);
  const notify = useNotifyCallSheet();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <button
          onClick={() => setCreating(true)}
          className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white"
        >
          + Новая смена
        </button>
      )}

      {creating && (
        <NewShiftForm
          onCancel={() => setCreating(false)}
          onSave={async (values) => {
            await upsertShift.mutateAsync(values);
            setCreating(false);
          }}
        />
      )}

      {isLoading && <p className="text-muted">Загрузка…</p>}

      <ul className="flex flex-col gap-2">
        {shifts?.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/p/${projectId}/shoot/shifts/${s.id}`} className="flex-1">
                <p className="font-medium text-text">
                  {formatDate(s.date)} {s.number ? `· смена №${s.number}` : ""}
                </p>
                <p className="text-sm text-muted">
                  {s.call_time ? new Date(s.call_time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit"}) : "время не задано"}
                  {s.location ? ` · ${s.location}` : ""}
                </p>
              </Link>
              {!s.published && <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">Черновик</span>}
            </div>

            {isAdmin && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => publishShift.mutate({ shiftId: s.id, published: !s.published })}
                  className="min-h-tap rounded-lg border border-border px-3 text-sm text-text"
                >
                  {s.published ? "Снять с публикации" : "Опубликовать"}
                </button>
                {s.published && (
                  <button
                    onClick={() => notify.mutate(s.id)}
                    className="min-h-tap rounded-lg border border-border px-3 text-sm text-text"
                  >
                    {notify.isPending ? "Отправляем…" : "Разослать изменения"}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {!isLoading && shifts?.length === 0 && (
        <p className="text-sm text-muted">Смен пока нет — добавьте первую или импортируйте вызывной из Excel.</p>
      )}
    </div>
  );
}

function NewShiftForm({
  onSave,
  onCancel,
}: {
  onSave: (values: { date: string; number: number | null; call_time: string | null; location: string; address: string; note: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [number, setNumber] = useState("");
  const [callTime, setCallTime] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Дата
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Номер смены
        <input value={number} onChange={(e) => setNumber(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" placeholder="напр. 12" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Сбор (дата и время)
        <input type="datetime-local" value={callTime} onChange={(e) => setCallTime(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Локация
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Адрес
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Заметка
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border border-border bg-bg p-3 text-text" />
      </label>
      <div className="flex gap-2">
        <button onClick={onCancel} className="min-h-tap flex-1 rounded-lg border border-border text-text">
          Отмена
        </button>
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({
              date,
              number: number ? Number(number) : null,
              call_time: callTime ? new Date(callTime).toISOString() : null,
              location,
              address,
              note,
            });
            setSaving(false);
          }}
          className="min-h-tap flex-1 rounded-lg bg-accent font-medium text-white disabled:opacity-60"
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
