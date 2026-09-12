import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useCreateInvite,
  useProjectInvites,
  useProjectMembers,
  useRevokeInvite,
} from "../hooks/useMembers";
import { useMyProjects } from "../hooks/useProjects";
import { DEPT_LABELS, DEPT_ORDER, type Dept } from "../lib/depts";

function inviteUrl(code: string) {
  return `${window.location.origin}${window.location.pathname}#/join/${code}`;
}

export default function GroupPage() {
  const { projectId } = useParams();
  const { data: projects } = useMyProjects();
  const isAdmin = projects?.find((p) => p.id === projectId)?.role === "admin";
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId ?? null);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="mb-2 text-lg font-semibold text-text">Группа</h1>
        {membersLoading && <p className="text-muted">Загрузка…</p>}
        <ul className="flex flex-col gap-2">
          {members?.map((m) => (
            <li key={m.user_id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">{m.full_name ?? "Без имени"}</span>
                {m.role === "admin" && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    Админ
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.departments.map((d) => (
                  <span key={d} className="rounded-full bg-dept-other px-2 py-0.5 text-xs text-text">
                    {DEPT_LABELS[d]}
                  </span>
                ))}
                {m.is_actor && (
                  <span className="rounded-full bg-dept-cast px-2 py-0.5 text-xs text-text">Актёр</span>
                )}
              </div>
              <div className="mt-2 flex gap-3 text-sm">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="text-accent underline">
                    Позвонить
                  </a>
                )}
                {m.email && <span className="text-muted">{m.email}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && projectId && <InvitesAdmin projectId={projectId} />}
    </div>
  );
}

function InvitesAdmin({ projectId }: { projectId: string }) {
  const { data: invites } = useProjectInvites(projectId);
  const createInvite = useCreateInvite(projectId);
  const revokeInvite = useRevokeInvite(projectId);
  const [dept, setDept] = useState<Dept | "">("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isActor, setIsActor] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // буфер обмена недоступен — ссылку можно скопировать вручную из карточки
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-text">Приглашения</h2>
      <p className="mb-3 text-sm text-muted">
        Ссылка работает, пока её не отозвали — можно приглашать группу постепенно, а не только при
        создании проекта.
      </p>

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value as Dept)}
            className="min-h-tap flex-1 rounded-lg border border-border bg-bg px-2 text-text"
          >
            <option value="">Любой цех</option>
            {DEPT_ORDER.map((d) => (
              <option key={d} value={d}>
                {DEPT_LABELS[d]}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
            className="min-h-tap rounded-lg border border-border bg-bg px-2 text-text"
          >
            <option value="member">Участник</option>
            <option value="admin">Админ</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={isActor} onChange={(e) => setIsActor(e.target.checked)} />
          Приглашённый — актёр
        </label>
        <button
          disabled={createInvite.isPending}
          onClick={() => createInvite.mutate({ dept: dept || null, role, isActor })}
          className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-60"
        >
          {createInvite.isPending ? "Создаём…" : "Создать ссылку-приглашение"}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {invites?.map((inv) => (
          <li
            key={inv.id}
            className={`rounded-xl border p-3 ${inv.revoked ? "border-border opacity-50" : "border-border bg-surface"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm text-text">{inv.code}</p>
                <p className="text-xs text-muted">
                  {inv.dept ? DEPT_LABELS[inv.dept] : "Любой цех"} · {inv.role === "admin" ? "Админ" : "Участник"}
                  {inv.is_actor ? " · Актёр" : ""} · использовано {inv.used_count}
                  {inv.max_uses ? `/${inv.max_uses}` : ""}
                </p>
              </div>
              {!inv.revoked && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => copy(inv.code, inv.id)} className="min-h-tap rounded-lg border border-border px-3 text-sm text-text">
                    {copiedId === inv.id ? "Скопировано" : "Копировать"}
                  </button>
                  <button
                    onClick={() => revokeInvite.mutate(inv.id)}
                    className="min-h-tap rounded-lg border border-danger px-3 text-sm text-danger"
                  >
                    Отозвать
                  </button>
                </div>
              )}
              {inv.revoked && <span className="text-xs text-muted">Отозвано</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
