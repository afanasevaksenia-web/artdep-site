import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Dept } from "../lib/depts";

export type Member = {
  user_id: string;
  role: "admin" | "member";
  is_actor: boolean;
  joined_at: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  departments: Dept[];
};

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ["members", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Member[]> => {
      const { data: members, error } = await supabase
        .from("project_members")
        .select("user_id, role, is_actor, joined_at, profiles(full_name, phone, email)")
        .eq("project_id", projectId!);
      if (error) throw error;

      const { data: depts, error: deptErr } = await supabase
        .from("member_departments")
        .select("user_id, dept")
        .eq("project_id", projectId!);
      if (deptErr) throw deptErr;

      const deptsByUser = new Map<string, Dept[]>();
      for (const row of depts ?? []) {
        const list = deptsByUser.get(row.user_id) ?? [];
        list.push(row.dept);
        deptsByUser.set(row.user_id, list);
      }

      return (members ?? []).map((m) => ({
        user_id: m.user_id,
        role: m.role,
        is_actor: m.is_actor,
        joined_at: m.joined_at,
        full_name: (m.profiles as any)?.full_name ?? null,
        phone: (m.profiles as any)?.phone ?? null,
        email: (m.profiles as any)?.email ?? null,
        departments: deptsByUser.get(m.user_id) ?? [],
      }));
    },
  });
}

export type Invite = {
  id: string;
  code: string;
  dept: Dept | null;
  role: "admin" | "member";
  is_actor: boolean;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  revoked: boolean;
};

export function useProjectInvites(projectId: string | null) {
  return useQuery({
    queryKey: ["invites", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function randomCode(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function useCreateInvite(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { dept: Dept | null; role: "admin" | "member"; isActor: boolean }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("invites")
        .insert({
          project_id: projectId,
          code: randomCode(),
          dept: args.dept,
          role: args.role,
          is_actor: args.isActor,
          created_by: userRes.user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", projectId] }),
  });
}

export function useRevokeInvite(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from("invites").update({ revoked: true }).eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", projectId] }),
  });
}
