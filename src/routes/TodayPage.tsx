import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useShifts } from "../hooks/useShifts";
import { useMyProjects } from "../hooks/useProjects";
import { useAuth } from "../state/AuthContext";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}

export default function TodayPage() {
  const { projectId } = useParams();
  const { session } = useAuth();
  const { data: projects } = useMyProjects();
  const myRole = projects?.find((p) => p.id === projectId)?.role;
  const { data: shifts } = useShifts(projectId ?? null);
  const qc = useQueryClient();

  const upcoming = (shifts ?? [])
    .filter((s) => s.published)
    .filter((s) => new Date(s.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const ackQuery = useQuery({
    queryKey: ["shift_ack_me", upcoming?.id, session?.user.id],
    enabled: !!upcoming && !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_acks")
        .select("acknowledged_at")
        .eq("shift_id", upcoming!.id)
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return data;
    },
  });

  const ackMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shift_acks")
        .upsert({ shift_id: upcoming!.id, user_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_ack_me", upcoming?.id, session?.user.id] }),
  });

  const ackBoard = useQuery({
    queryKey: ["shift_ack_board", upcoming?.id],
    enabled: !!upcoming && myRole === "admin",
    queryFn: async () => {
      const [{ data: members }, { data: acks }] = await Promise.all([
        supabase.from("project_members").select("user_id, profiles(full_name)").eq("project_id", projectId!),
        supabase.from("shift_acks").select("user_id").eq("shift_id", upcoming!.id),
      ]);
      const ackedIds = new Set((acks ?? []).map((a) => a.user_id));
      const notAcked = (members ?? []).filter((m) => !ackedIds.has(m.user_id));
      return { total: members?.length ?? 0, acked: ackedIds.size, notAcked };
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text">Сегодня</h1>

      {!upcoming && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Опубликованного вызывного на ближайшие дни пока нет.
        </div>
      )}

      {upcoming && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Мой вызов</p>
          <p className="mt-1 text-lg font-semibold text-text">{formatDateTime(upcoming.call_time)}</p>
          {upcoming.location && <p className="text-text">{upcoming.location}</p>}
          {upcoming.address && (
            <a
              className="mt-1 inline-block text-accent underline"
              target="_blank"
              rel="noreferrer"
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(upcoming.address)}`}
            >
              Маршрут → {upcoming.address}
            </a>
          )}
          {upcoming.note && <p className="mt-2 text-sm text-muted">{upcoming.note}</p>}

          <button
            disabled={!!ackQuery.data || ackMutation.isPending}
            onClick={() => ackMutation.mutate()}
            className="mt-4 min-h-tap w-full rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-60"
          >
            {ackQuery.data ? "Вы подтвердили вызов ✓" : ackMutation.isPending ? "Отправляем…" : "Подтверждаю"}
          </button>
        </div>
      )}

      {myRole === "admin" && upcoming && ackBoard.data && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-text">
            Подтвердили вызывной: {ackBoard.data.acked} из {ackBoard.data.total}
          </p>
          {ackBoard.data.notAcked.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {ackBoard.data.notAcked.map((m: any) => (
                <li key={m.user_id}>{m.profiles?.full_name ?? "Без имени"}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
