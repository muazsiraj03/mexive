import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  credits: number;
  planCredits: number;
  bonusCredits: number;
  totalCredits: number;
  hasUnlimitedCredits: boolean;
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  fileName: string;
  displayName: string | null;
  createdAt: Date;
  batchId: string | null;
  marketplaces: {
    name: string;
    title: string;
    description: string;
    keywords: string[];
  }[];
}

export interface GenerationBatch {
  id: string;
  name: string;
  fileCount: number;
  createdAt: Date;
  generations: GenerationResult[];
}

interface DashboardContextType {
  user: User;
  setUser: (user: User) => void;
  generations: GenerationResult[];
  batches: GenerationBatch[];
  addGeneration: (generation: GenerationResult, batchId?: string) => Promise<string | undefined>;
  createBatch: (name: string, fileCount: number) => Promise<string | null>;
  deleteGeneration: (id: string) => void;
  deleteBatch: (id: string) => Promise<void>;
  updateMarketplaceKeywords: (generationId: string, marketplaceName: string, keywords: string[]) => Promise<void>;
  updateDisplayName: (generationId: string, displayName: string) => Promise<void>;
  regenerateMetadata: (generationId: string, marketplaces: string[], keywordCount?: number, titleMaxChars?: number, descriptionMaxChars?: number) => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  refreshGenerations: () => Promise<void>;
}

const defaultUser: User = {
  id: "",
  name: "",
  email: "",
  plan: "free",
  credits: 0,
  planCredits: 0,
  bonusCredits: 0,
  totalCredits: 0,
  hasUnlimitedCredits: false,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User>(defaultUser);
  const [generations, setGenerations] = useState<GenerationResult[]>([]);
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!authUser) return false;
    
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: authUser.id,
        _role: 'admin'
      });
      
      if (error) {
        console.error("Admin check error:", error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error("Admin check error:", error);
      return false;
    }
  }, [authUser]);

  const refreshProfile = async () => {
    if (!authUser) return;

    // Fetch profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    // Fetch subscription data
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    // Find plan config to check if unlimited and get default credits
    const { data: planConfig } = await supabase
      .from("pricing_config")
      .select("is_unlimited, credits")
      .eq("plan_name", subscription?.plan || "free")
      .single();

    // Calculate credits breakdown
    const planCredits = subscription?.credits_total || planConfig?.credits || 0;
    const bonusCredits = subscription?.bonus_credits || 0;
    const totalCredits = planCredits + bonusCredits;

    setUser({
      id: authUser.id,
      name: profile?.full_name || authUser.email || "",
      email: authUser.email || "",
      avatar: profile?.avatar_url || undefined,
      plan: (subscription?.plan as "free" | "pro" | "enterprise") || "free",
      credits: subscription?.credits_remaining || 0,
      planCredits,
      bonusCredits,
      totalCredits,
      hasUnlimitedCredits: planConfig?.is_unlimited || false,
    });
  };

  const refreshGenerations = async () => {
    if (!authUser) return;

    const { data: generationsData } = await supabase
      .from("generations")
      .select(`
        id,
        image_url,
        file_name,
        display_name,
        created_at,
        batch_id,
        generation_marketplaces (
          marketplace_name,
          title,
          description,
          keywords
        )
      `)
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    // Fetch batches
    const { data: batchesData } = await supabase
      .from("generation_batches")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (generationsData) {
      const mappedGenerations: GenerationResult[] = generationsData.map((g) => ({
        id: g.id,
        imageUrl: g.image_url,
        fileName: g.file_name,
        displayName: g.display_name,
        createdAt: new Date(g.created_at),
        batchId: g.batch_id,
        marketplaces: g.generation_marketplaces.map((mp: { marketplace_name: string; title: string; description?: string; keywords?: string[] }) => ({
          name: mp.marketplace_name,
          title: mp.title,
          description: mp.description || "",
          keywords: mp.keywords || [],
        })),
      }));
      setGenerations(mappedGenerations);

      // Group generations by batch
      if (batchesData) {
        const mappedBatches: GenerationBatch[] = batchesData.map((b) => ({
          id: b.id,
          name: b.name,
          fileCount: b.file_count,
          createdAt: new Date(b.created_at),
          generations: mappedGenerations.filter((g) => g.batchId === b.id),
        }));
        setBatches(mappedBatches);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [, , adminStatus] = await Promise.all([
        refreshProfile(), 
        refreshGenerations(),
        checkAdminStatus()
      ]);
      setIsAdmin(adminStatus);
      setLoading(false);
    };

    loadData();
  }, [authUser, checkAdminStatus]);

  const createBatch = async (name: string, fileCount: number): Promise<string | null> => {
    if (!authUser) return null;

    const { data, error } = await supabase
      .from("generation_batches")
      .insert({
        user_id: authUser.id,
        name,
        file_count: fileCount,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating batch:", error);
      return null;
    }

    return data.id;
  };

  const addGeneration = async (generation: GenerationResult, batchId?: string): Promise<string | undefined> => {
    if (!authUser) return undefined;

    // Insert generation
    const { data: newGen, error: genError } = await supabase
      .from("generations")
      .insert({
        user_id: authUser.id,
        image_url: generation.imageUrl,
        file_name: generation.fileName,
        display_name: generation.displayName ?? null,
        batch_id: batchId ?? null,
      })
      .select()
      .single();

    if (genError || !newGen) {
      console.error("Error adding generation:", genError);
      return undefined;
    }

    // Insert marketplaces
    const marketplaceInserts = generation.marketplaces.map((mp) => ({
      generation_id: newGen.id,
      marketplace_name: mp.name,
      title: mp.title,
      description: mp.description,
      keywords: mp.keywords,
    }));

    await supabase.from("generation_marketplaces").insert(marketplaceInserts);

    // Deduct credits (skip for admins and users with unlimited credits)
    if (!isAdmin && !user.hasUnlimitedCredits) {
      await supabase
        .from("subscriptions")
        .update({ credits_remaining: Math.max(0, user.credits - generation.marketplaces.length) })
        .eq("user_id", authUser.id);
    }

    // Refresh data
    await Promise.all([refreshProfile(), refreshGenerations()]);
    
    return newGen.id;
  };

  const deleteBatch = async (id: string) => {
    if (!authUser) return;

    // Delete the batch (generations will have batch_id set to null due to ON DELETE SET NULL)
    await supabase.from("generation_batches").delete().eq("id", id);
    
    // Also delete all generations in this batch
    await supabase.from("generations").delete().eq("batch_id", id);
    
    await refreshGenerations();
  };

  const deleteGeneration = async (id: string) => {
    if (!authUser) return;

    await supabase.from("generations").delete().eq("id", id);
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  };

  const updateMarketplaceKeywords = async (generationId: string, marketplaceName: string, keywords: string[]) => {
    if (!authUser) return;

    const { error } = await supabase
      .from("generation_marketplaces")
      .update({ keywords })
      .eq("generation_id", generationId)
      .eq("marketplace_name", marketplaceName);

    if (error) {
      console.error("Error updating keywords:", error);
      throw error;
    }

    // Update local state
    setGenerations((prev) =>
      prev.map((g) =>
        g.id === generationId
          ? {
              ...g,
              marketplaces: g.marketplaces.map((mp) =>
                mp.name === marketplaceName ? { ...mp, keywords } : mp
              ),
            }
          : g
      )
    );
  };

  const updateDisplayName = async (generationId: string, displayName: string) => {
    if (!authUser) return;

    const { error } = await supabase
      .from("generations")
      .update({ display_name: displayName })
      .eq("id", generationId)
      .eq("user_id", authUser.id);

    if (error) {
      console.error("Error updating display name:", error);
      throw error;
    }

    // Update local state
    setGenerations((prev) =>
      prev.map((g) =>
        g.id === generationId ? { ...g, displayName } : g
      )
    );
  };

  const regenerateMetadata = async (
    generationId: string,
    marketplaces: string[],
    keywordCount = 30,
    titleMaxChars = 200,
    descriptionMaxChars = 500
  ) => {
    if (!authUser) return;

    // Find the generation
    const generation = generations.find((g) => g.id === generationId);
    if (!generation) throw new Error("Generation not found");

    // Call the AI edge function
    const { data, error } = await supabase.functions.invoke("generate-metadata", {
      body: {
        imageUrl: generation.imageUrl,
        marketplaces,
        keywordCount,
        titleMaxChars,
        descriptionMaxChars,
      },
    });

    if (error) {
      console.error("Regenerate error:", error);
      throw error;
    }

    if (!data?.results || !Array.isArray(data.results)) {
      throw new Error("Could not analyze image");
    }

    // Delete existing marketplace data for this generation
    await supabase
      .from("generation_marketplaces")
      .delete()
      .eq("generation_id", generationId);

    // Insert new marketplace data
    const marketplaceInserts = data.results.map((result: { marketplace: string; title: string; description: string; keywords: string[] }) => ({
      generation_id: generationId,
      marketplace_name: result.marketplace,
      title: result.title,
      description: result.description || "",
      keywords: result.keywords,
    }));

    await supabase.from("generation_marketplaces").insert(marketplaceInserts);

    // Deduct credits (skip for admins and users with unlimited credits)
    if (!isAdmin && !user.hasUnlimitedCredits) {
      await supabase
        .from("subscriptions")
        .update({ credits_remaining: Math.max(0, user.credits - marketplaces.length) })
        .eq("user_id", authUser.id);
    }

    // Refresh data
    await Promise.all([refreshProfile(), refreshGenerations()]);
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        setUser,
        generations,
        batches,
        addGeneration,
        createBatch,
        deleteGeneration,
        deleteBatch,
        updateMarketplaceKeywords,
        updateDisplayName,
        regenerateMetadata,
        loading,
        isAdmin,
        refreshProfile,
        refreshGenerations,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
