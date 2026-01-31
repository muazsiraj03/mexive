import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SocialLink[];
    },
  });
}

export function useAdminSocialLinks() {
  const queryClient = useQueryClient();

  const linksQuery = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SocialLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (link: Omit<SocialLink, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("social_links")
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Social link created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialLink> & { id: string }) => {
      const { data, error } = await supabase
        .from("social_links")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Social link updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Social link deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    links: linksQuery.data || [],
    isLoading: linksQuery.isLoading,
    error: linksQuery.error,
    createLink: createMutation.mutate,
    updateLink: updateMutation.mutate,
    deleteLink: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
