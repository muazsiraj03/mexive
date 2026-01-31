import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Benefit {
  id: string;
  tool: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBenefits() {
  const queryClient = useQueryClient();

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("*")
        .order("tool")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Benefit[];
    },
  });

  const createBenefit = useMutation({
    mutationFn: async (benefit: Omit<Benefit, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("benefits")
        .insert(benefit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create benefit: " + error.message);
    },
  });

  const updateBenefit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Benefit> & { id: string }) => {
      const { data, error } = await supabase
        .from("benefits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update benefit: " + error.message);
    },
  });

  const deleteBenefit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("benefits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete benefit: " + error.message);
    },
  });

  const getBenefitsByTool = (tool: string) => {
    return benefits
      .filter((b) => b.tool === tool && b.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  return {
    benefits,
    isLoading,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    getBenefitsByTool,
  };
}
