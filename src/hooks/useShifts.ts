import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type Shift = Database["public"]["Tables"]["shifts"]["Row"];
export type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];
export type ShiftTiming = Database["public"]["Tables"]["shift_timing"]["Row"];

export function useShifts(projectId: string | null) {
  return useQuery({
    queryKey: ["shifts", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Shift[]> => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("project_id", projectId!)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertShift(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shift: Partial<ShiftInsert> & { id?: string }) => {
      if (shift.id) {
        const { id, ...rest } = shift;
        const { data, error } = await supabase.from("shifts").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("shifts")
        .insert({ ...shift, project_id: projectId, created_by: userRes.user?.id, date: shift.date ?? new Date().toISOString().slice(0, 10) } as ShiftInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts", projectId] }),
  });
}

export function usePublishShift(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { shiftId: string; published: boolean }) => {
      const { error } = await supabase.from("shifts").update({ published: args.published }).eq("id", args.shiftId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts", projectId] }),
  });
}

export function useNotifyCallSheet() {
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.rpc("notify_call_sheet", { p_shift_id: shiftId });
      if (error) throw error;
    },
  });
}

export function useShiftTiming(shiftId: string | null) {
  return useQuery({
    queryKey: ["shift_timing", shiftId],
    enabled: !!shiftId,
    queryFn: async (): Promise<ShiftTiming[]> => {
      const { data, error } = await supabase
        .from("shift_timing")
        .select("*")
        .eq("shift_id", shiftId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertShiftTiming(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<ShiftTiming> & { id?: string }) => {
      if (row.id) {
        const { id, ...rest } = row;
        const { error } = await supabase.from("shift_timing").update(rest).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("shift_timing").insert({ ...row, shift_id: shiftId } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_timing", shiftId] }),
  });
}

export function useDeleteShiftTiming(shiftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_timing").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_timing", shiftId] }),
  });
}
