import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreditTier {
  id: string;
  planName: string;
  credits: number;
  priceCents: number;
  price: number; // Computed from priceCents
  sortOrder: number;
  isActive: boolean;
}

export function useCreditTiers() {
  const [tiers, setTiers] = useState<CreditTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("credit_tiers")
        .select("*")
        .eq("is_active", true)
        .order("plan_name")
        .order("sort_order");

      if (error) {
        console.error("Error fetching credit tiers:", error);
        setError(error.message);
        return;
      }

      setTiers(
        (data || []).map((tier) => ({
          id: tier.id,
          planName: tier.plan_name,
          credits: tier.credits,
          priceCents: tier.price_cents,
          price: tier.price_cents / 100,
          sortOrder: tier.sort_order ?? 0,
          isActive: tier.is_active ?? true,
        }))
      );
      setError(null);
    } catch (err) {
      console.error("Error fetching credit tiers:", err);
      setError("Failed to load credit tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("credit_tiers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_tiers" },
        () => {
          fetchTiers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTiers]);

  // Get tiers grouped by plan
  const getTiersByPlan = useCallback(
    (planName: string) => {
      return tiers
        .filter((t) => t.planName === planName && t.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [tiers]
  );

  // Get default tier for a plan
  const getDefaultTier = useCallback(
    (planName: string): CreditTier | null => {
      const planTiers = getTiersByPlan(planName);
      return planTiers.length > 0 ? planTiers[0] : null;
    },
    [getTiersByPlan]
  );

  return {
    tiers,
    loading,
    error,
    refresh: fetchTiers,
    getTiersByPlan,
    getDefaultTier,
  };
}
