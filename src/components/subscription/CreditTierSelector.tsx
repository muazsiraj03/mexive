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
        // Fallback to hardcoded tiers
        setTiers(FALLBACK_TIERS[planName] || []);
      } else if (data && data.length > 0) {
        setTiers(data.map(t => ({ credits: t.credits, price: t.price_cents / 100 })));
      } else {
        // Use fallback if no tiers in database
        setTiers(FALLBACK_TIERS[planName] || []);
      }
      setLoading(false);
    };

    fetchTiers();
  }, [planName]);

  if (loading || tiers.length === 0) {
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
            {tier.credits} credits / month
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Fallback credit tier configurations (used if DB fetch fails)
const FALLBACK_TIERS: Record<string, CreditTier[]> = {
  starter: [
    { credits: 2000, price: 4.99 },
  ],
  pro: [
    { credits: 5000, price: 9.99 },
  ],
};

// Helper to get default tier for a plan
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
        .single();

      if (error || !data) {
        // Fallback
        const fallback = FALLBACK_TIERS[planName];
        setTier(fallback ? fallback[0] : null);
      } else {
        setTier({ credits: data.credits, price: data.price_cents / 100 });
      }
    };

    if (planName && planName !== 'free') {
      fetchDefault();
    }
  }, [planName]);

  return tier;
}
