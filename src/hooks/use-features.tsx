import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Feature {
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

export function useFeatures() {
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .order("tool")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Feature[];
    },
  });

  const createFeature = useMutation({
    mutationFn: async (feature: Omit<Feature, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("features")
        .insert(feature)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create feature: " + error.message);
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Feature> & { id: string }) => {
      const { data, error } = await supabase
        .from("features")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update feature: " + error.message);
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("features").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete feature: " + error.message);
    },
  });

  const getFeaturesByTool = (tool: string) => {
    if (tool === "all") {
      return features.filter((f) => f.tool === "all" && f.is_active);
    }
    return features
      .filter((f) => (f.tool === tool || f.tool === "all") && f.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  return {
    features,
    isLoading,
    createFeature,
    updateFeature,
    deleteFeature,
    getFeaturesByTool,
  };
}
