import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  category: string;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  read_time_minutes: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type BlogPostInsert = Omit<BlogPost, "id" | "created_at" | "updated_at">;
export type BlogPostUpdate = Partial<BlogPostInsert> & { id: string };

export function useBlogPosts(publishedOnly = true) {
  return useQuery({
    queryKey: ["blog-posts", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: BlogPostInsert) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BlogPostUpdate) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", data.slug] });
      toast.success("Blog post updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update post: ${error.message}`);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}
