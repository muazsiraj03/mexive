import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PricingPlan {
  id: string;
  name: string;
  plan_name: string; // Raw database field
  displayName: string;
  priceCents: number;
  price: number; // Convenience: priceCents / 100
  credits: number;
  period: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  isUnlimited: boolean;
  sortOrder: number;
  tools_access: string[];
  daily_credit_reset: boolean;
}

// Fallback pricing in case database is unavailable
const FALLBACK_PRICING: PricingPlan[] = [
  {
    id: "fallback-free",
    name: "free",
    plan_name: "free",
    displayName: "Free",
    priceCents: 0,
    price: 0,
    credits: 5,
    period: "",
    features: ["5 credits included", "AI image analysis", "All 3 marketplaces", "CSV export"],
    isPopular: false,
    isActive: true,
    isUnlimited: false,
    sortOrder: 1,
    tools_access: ["metadata-generator"],
    daily_credit_reset: true,
  },
  {
    id: "fallback-pro",
    name: "pro",
    plan_name: "pro",
    displayName: "Pro",
    priceCents: 1900,
    price: 19,
    credits: 100,
    period: "/month",
    features: ["100 credits/month", "Everything in Free", "Bulk processing (10 images)", "Priority support", "Rollover unused credits"],
    isPopular: true,
    isActive: true,
    isUnlimited: false,
    sortOrder: 2,
    tools_access: ["metadata-generator", "image-to-prompt", "file-reviewer"],
    daily_credit_reset: false,
  },
  {
    id: "fallback-enterprise",
    name: "enterprise",
    plan_name: "enterprise",
    displayName: "Enterprise",
    priceCents: 4900,
    price: 49,
    credits: 500,
    period: "/month",
    features: ["500 credits/month", "Everything in Pro", "API access", "Dedicated support", "Custom integrations"],
    isPopular: false,
    isActive: true,
    isUnlimited: false,
    sortOrder: 3,
    tools_access: ["metadata-generator", "image-to-prompt", "file-reviewer"],
    daily_credit_reset: false,
  },
];

export function usePricing() {
  const [plans, setPlans] = useState<PricingPlan[]>(FALLBACK_PRICING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("pricing_config")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) {
        console.error("Error fetching pricing:", fetchError);
        setError(fetchError.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedPlans: PricingPlan[] = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.plan_name as string,
          plan_name: row.plan_name as string,
          displayName: row.display_name as string,
          priceCents: row.price_cents as number,
          price: (row.price_cents as number) / 100,
          credits: row.credits as number,
          period: (row.period as string) || "",
          features: (row.features as string[]) || [],
          isPopular: (row.is_popular as boolean) || false,
          isActive: row.is_active as boolean,
          isUnlimited: (row.is_unlimited as boolean) || false,
          sortOrder: (row.sort_order as number) || 0,
          tools_access: (row.tools_access as string[]) || ["metadata-generator", "image-to-prompt", "file-reviewer"],
          daily_credit_reset: (row.daily_credit_reset as boolean) || false,
        }));
        setPlans(mappedPlans);
        setError(null);
      }
    } catch (err) {
      console.error("Error in fetchPricing:", err);
      setError("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("pricing_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pricing_config" },
        () => {
          fetchPricing();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPricing]);

  const getPlanByName = (name: string): PricingPlan | undefined => {
    return plans.find((p) => p.name === name);
  };

  const getFreePlan = (): PricingPlan => {
    return plans.find((p) => p.name === "free") || FALLBACK_PRICING[0];
  };

  const getProPlan = (): PricingPlan => {
    return plans.find((p) => p.name === "pro") || FALLBACK_PRICING[1];
  };

  return {
    plans,
    loading,
    error,
    refresh: fetchPricing,
    getPlanByName,
    getFreePlan,
    getProPlan,
  };
}

// Static helper for edge function (server-side)
export const getPlanConfig = (planName: string) => {
  const plan = FALLBACK_PRICING.find((p) => p.name === planName);
  return plan
    ? { credits: plan.credits, price: plan.priceCents }
    : { credits: 5, price: 0 };
};
