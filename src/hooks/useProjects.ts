import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Dept } from "../lib/depts";

export type ProjectWithRole = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  role: "admin" | "member";
};

export function useMyProjects() {
  return useQuery({
    queryKey: ["projects", "mine"],
    queryFn: async (): Promise<ProjectWithRole[]> => {
      const { data, error } = await supabase
        .from("project_members")
        .select("role, projects(id, name, timezone, created_at)")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((row) => row.projects)
        .map((row) => ({
          id: (row.projects as any).id,
          name: (row.projects as any).name,
          timezone: (row.projects as any).timezone,
          created_at: (row.projects as any).created_at,
          role: row.role,
        }));
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { name: string; timezone: string; dept: Dept | null }) => {
      const { data, error } = await supabase.rpc("create_project", {
        p_name: args.name,
        p_timezone: args.timezone,
        p_dept: args.dept ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", "mine"] });
    },
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("accept_invite", { p_code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", "mine"] });
    },
  });
}
