import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HowItWorksStep {
  id: string;
  tool: string;
  step_number: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHowItWorks() {
  const [steps, setSteps] = useState<HowItWorksStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from("how_it_works")
        .select("*")
        .order("tool")
        .order("sort_order");

      if (error) throw error;
      setSteps((data as HowItWorksStep[]) || []);
    } catch (error) {
      console.error("Error fetching how it works steps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, []);

  const addStep = async (step: Omit<HowItWorksStep, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase.from("how_it_works").insert([step]);
      if (error) throw error;
      toast.success("Step added successfully");
      fetchSteps();
    } catch (error) {
      console.error("Error adding step:", error);
      toast.error("Failed to add step");
    }
  };

  const updateStep = async (id: string, updates: Partial<HowItWorksStep>) => {
    try {
      const { error } = await supabase
        .from("how_it_works")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      toast.success("Step updated successfully");
      fetchSteps();
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step");
    }
  };

  const deleteStep = async (id: string) => {
    try {
      const { error } = await supabase.from("how_it_works").delete().eq("id", id);
      if (error) throw error;
      toast.success("Step deleted successfully");
      fetchSteps();
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
    }
  };

  const getStepsByTool = (tool: string) => {
    return steps.filter((s) => s.tool === tool && s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  };

  return {
    steps,
    loading,
    addStep,
    updateStep,
    deleteStep,
    getStepsByTool,
    refetch: fetchSteps,
  };
}
