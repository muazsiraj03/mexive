import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Comparison {
  id: string;
  aspect: string;
  manual_value: string;
  ai_value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useComparisons() {
  const queryClient = useQueryClient();

  const { data: comparisons = [], isLoading, error } = useQuery({
    queryKey: ["comparisons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparisons")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Comparison[];
    },
  });

  const createComparison = useMutation({
    mutationFn: async (comparison: Omit<Comparison, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("comparisons")
        .insert(comparison)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      toast.success("Comparison created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create comparison: " + error.message);
    },
  });

  const updateComparison = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Comparison> & { id: string }) => {
      const { data, error } = await supabase
        .from("comparisons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      toast.success("Comparison updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update comparison: " + error.message);
    },
  });

  const deleteComparison = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comparisons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      toast.success("Comparison deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete comparison: " + error.message);
    },
  });

  const activeComparisons = comparisons.filter((c) => c.is_active);

  return {
    comparisons,
    activeComparisons,
    isLoading,
    error,
    createComparison,
    updateComparison,
    deleteComparison,
  };
}
