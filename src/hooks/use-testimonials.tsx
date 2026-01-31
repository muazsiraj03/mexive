import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  rating: number;
  content: string;
  tool: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LandingStat {
  id: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TestimonialInput = Omit<Testimonial, "id" | "created_at" | "updated_at">;
export type LandingStatInput = Omit<LandingStat, "id" | "created_at" | "updated_at">;

export function useTestimonials(adminMode = false) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTestimonials((data as unknown as Testimonial[]) || []);
    } catch (error: any) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [adminMode]);

  const addTestimonial = async (input: Partial<TestimonialInput>) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .insert({
          name: input.name || "",
          role: input.role || "",
          avatar_url: input.avatar_url || "",
          rating: input.rating || 5,
          content: input.content || "",
          tool: input.tool || "",
          is_active: input.is_active ?? true,
          sort_order: input.sort_order || testimonials.length + 1,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setTestimonials((prev) => [...prev, data as unknown as Testimonial]);
      toast.success("Testimonial added successfully");
      return true;
    } catch (error: any) {
      console.error("Error adding testimonial:", error);
      toast.error("Failed to add testimonial");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<TestimonialInput>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      toast.success("Testimonial updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      toast.success("Testimonial deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    testimonials,
    isLoading,
    isSaving,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    refetch: fetchTestimonials,
  };
}

export function useLandingStats(adminMode = false) {
  const [stats, setStats] = useState<LandingStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("landing_stats")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setStats((data as unknown as LandingStat[]) || []);
    } catch (error: any) {
      console.error("Error fetching landing stats:", error);
      toast.error("Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [adminMode]);

  const addStat = async (input: Partial<LandingStatInput>) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("landing_stats")
        .insert({
          label: input.label || "",
          value: input.value || "",
          is_active: input.is_active ?? true,
          sort_order: input.sort_order || stats.length + 1,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setStats((prev) => [...prev, data as unknown as LandingStat]);
      toast.success("Stat added successfully");
      return true;
    } catch (error: any) {
      console.error("Error adding stat:", error);
      toast.error("Failed to add stat");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateStat = async (id: string, updates: Partial<LandingStatInput>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("landing_stats")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setStats((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      toast.success("Stat updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating stat:", error);
      toast.error("Failed to update stat");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStat = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("landing_stats")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setStats((prev) => prev.filter((s) => s.id !== id));
      toast.success("Stat deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting stat:", error);
      toast.error("Failed to delete stat");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    stats,
    isLoading,
    isSaving,
    addStat,
    updateStat,
    deleteStat,
    refetch: fetchStats,
  };
}
