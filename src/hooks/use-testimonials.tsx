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

export type TestimonialInput = Omit<Testimonial, "id" | "created_at" | "updated_at">;

export function useTestimonials(adminMode = false) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      // For admin, we need to fetch all testimonials including inactive ones
      // The RLS policy allows admins to see all
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      // Type assertion since the types aren't generated yet
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

  const reorderTestimonials = async (reorderedTestimonials: Testimonial[]) => {
    setIsSaving(true);
    try {
      const updates = reorderedTestimonials.map((t, index) => ({
        id: t.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from("testimonials")
          .update({ sort_order: update.sort_order } as any)
          .eq("id", update.id);
      }

      setTestimonials(
        reorderedTestimonials.map((t, index) => ({
          ...t,
          sort_order: index + 1,
        }))
      );
      toast.success("Order updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error reordering testimonials:", error);
      toast.error("Failed to update order");
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
    reorderTestimonials,
    refetch: fetchTestimonials,
  };
}
