import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Scene = Database["public"]["Tables"]["scenes"]["Row"];
export type SceneInsert = Database["public"]["Tables"]["scenes"]["Insert"];
export type SceneStatus = Database["public"]["Enums"]["scene_status_enum"];

export function useScenes(projectId: string | null) {
  return useQuery({
    queryKey: ["scenes", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Scene[]> => {
      const { data, error } = await supabase
        .from("scenes")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order", { ascending: true })
        .order("number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertScene(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scene: Partial<SceneInsert> & { id?: string }) => {
      if (scene.id) {
        const { id, ...rest } = scene;
        const { data, error } = await supabase.from("scenes").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("scenes")
        .insert({ ...scene, project_id: projectId, created_by: userRes.user?.id, number: scene.number ?? "" } as SceneInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenes", projectId] }),
  });
}

export function useMoveScene(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { sceneId: string; shiftId: string | null }) => {
      const { error } = await supabase.from("scenes").update({ shift_id: args.shiftId }).eq("id", args.sceneId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenes", projectId] }),
  });
}

export function useSetSceneStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { sceneId: string; status: SceneStatus }) => {
      const { error } = await supabase.rpc("set_scene_status", { p_scene_id: args.sceneId, p_status: args.status });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenes", projectId] }),
  });
}

export function useDeleteScene(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sceneId: string) => {
      const { error } = await supabase.from("scenes").delete().eq("id", sceneId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenes", projectId] }),
  });
}
