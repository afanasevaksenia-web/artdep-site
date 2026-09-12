import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

export type HistoryRow = Database["public"]["Tables"]["history"]["Row"] & {
  author_name: string | null;
};

export function useHistory(projectId: string | null, tableName: "scenes" | "shifts", rowId: string | null) {
  return useQuery({
    queryKey: ["history", projectId, tableName, rowId],
    enabled: !!projectId && !!rowId,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase
        .from("history")
        .select("*, profiles(full_name)")
        .eq("project_id", projectId!)
        .eq("table_name", tableName)
        .eq("row_id", rowId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({ ...row, author_name: row.profiles?.full_name ?? null }));
    },
  });
}

export function useRevertHistory(invalidateKeys: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (historyId: string) => {
      const { error } = await supabase.rpc("revert_history", { p_history_id: historyId });
      if (error) throw error;
    },
    onSuccess: () => {
      for (const key of invalidateKeys) qc.invalidateQueries({ queryKey: key });
    },
  });
}
