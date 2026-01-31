import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FAQInput = Omit<FAQ, "id" | "created_at" | "updated_at">;

export function useFAQs(adminMode = false) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFAQs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setFaqs((data as unknown as FAQ[]) || []);
    } catch (error: any) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to load FAQs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [adminMode]);

  const addFAQ = async (input: Partial<FAQInput>) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("faqs")
        .insert({
          question: input.question || "",
          answer: input.answer || "",
          is_active: input.is_active ?? true,
          sort_order: input.sort_order || faqs.length + 1,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setFaqs((prev) => [...prev, data as unknown as FAQ]);
      toast.success("FAQ added successfully");
      return true;
    } catch (error: any) {
      console.error("Error adding FAQ:", error);
      toast.error("Failed to add FAQ");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateFAQ = async (id: string, updates: Partial<FAQInput>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("faqs")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
      toast.success("FAQ updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("FAQ deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    faqs,
    isLoading,
    isSaving,
    addFAQ,
    updateFAQ,
    deleteFAQ,
    refetch: fetchFAQs,
  };
}
