import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface CreditTier {
  credits: number;
  price: number;
}

interface CreditTierSelectorProps {
  planName: string;
  selectedCredits: number;
  onSelect: (credits: number, price: number) => void;
  disabled?: boolean;
}

export function CreditTierSelector({
  planName,
  selectedCredits,
  onSelect,
  disabled,
}: CreditTierSelectorProps) {
  const [tiers, setTiers] = useState<CreditTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      const { data, error } = await supabase
        .from("credit_tiers")
        .select("credits, price_cents")
        .eq("plan_name", planName)
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("Error fetching credit tiers:", error);
        setTiers([]);
      } else if (data && data.length > 0) {
        setTiers(data.map(t => ({ credits: t.credits, price: t.price_cents / 100 })));
      } else {
        // No tiers in database - don't show selector
        setTiers([]);
      }
      setLoading(false);
    };

    fetchTiers();

    // Subscribe to real-time updates for credit tiers
    const channel = supabase
      .channel(`credit_tiers_${planName}`)
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
  }, [planName]);

  // Don't render anything if loading or no tiers exist
  if (loading || tiers.length === 0) {
    return null;
  }

  // Only show selector if there are multiple tiers
  if (tiers.length === 1) {
    return null;
  }

  return (
    <Select
      value={String(selectedCredits)}
      onValueChange={(value) => {
        const tier = tiers.find(t => t.credits === Number(value));
        if (tier) {
          onSelect(tier.credits, tier.price);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full rounded-lg border-border/60 bg-background hover:border-border">
        <SelectValue placeholder="Select credits" />
      </SelectTrigger>
      <SelectContent>
        {tiers.map((tier) => (
          <SelectItem key={tier.credits} value={String(tier.credits)}>
            {tier.credits.toLocaleString()} credits / month
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper to get default tier for a plan (returns null if no tiers exist)
export function useDefaultTier(planName: string): CreditTier | null {
  const [tier, setTier] = useState<CreditTier | null>(null);

  useEffect(() => {
    const fetchDefault = async () => {
      const { data, error } = await supabase
        .from("credit_tiers")
        .select("credits, price_cents")
        .eq("plan_name", planName)
        .eq("is_active", true)
        .order("sort_order")
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // No tiers in database
        setTier(null);
      } else {
        setTier({ credits: data.credits, price: data.price_cents / 100 });
      }
    };

    if (planName && planName !== 'free') {
      fetchDefault();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`default_tier_${planName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_tiers" },
        () => {
          if (planName && planName !== 'free') {
            fetchDefault();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planName]);

  return tier;
}
