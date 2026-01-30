import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  bonusCredits: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CreditPackPurchase {
  id: string;
  credits: number;
  amount: number;
  status: string;
  createdAt: Date;
}

export function useCreditPacks() {
  const { user, session } = useAuth();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [purchases, setPurchases] = useState<CreditPackPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const fetchPacks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      setPacks(
        (data || []).map((pack) => ({
          id: pack.id,
          name: pack.name,
          credits: pack.credits,
          priceCents: pack.price_cents,
          bonusCredits: pack.bonus_credits || 0,
          isPopular: pack.is_popular || false,
          isActive: pack.is_active || true,
          sortOrder: pack.sort_order || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching credit packs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("credit_pack_purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setPurchases(
        (data || []).map((purchase) => ({
          id: purchase.id,
          credits: purchase.credits,
          amount: purchase.amount,
          status: purchase.status || "pending",
          createdAt: new Date(purchase.created_at || Date.now()),
        }))
      );
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchPacks();

    // Subscribe to real-time updates for credit packs
    const channel = supabase
      .channel("credit_packs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_packs" },
        () => {
          fetchPacks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPacks]);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user, fetchPurchases]);

  const purchasePack = async (packId: string) => {
    if (!user || !session) {
      toast.error("Please log in to purchase credits");
      return { success: false };
    }

    setPurchaseLoading(true);
    try {
      const response = await supabase.functions.invoke("purchase-credits", {
        body: { packId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to purchase credits");
      }

      const result = response.data;
      
      if (result.error) {
        toast.error(result.error);
        return { success: false };
      }

      toast.success(result.message || "Credit pack purchase submitted!");
      await fetchPurchases();
      return { success: true };
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to purchase credit pack");
      return { success: false };
    } finally {
      setPurchaseLoading(false);
    }
  };

  return {
    packs,
    purchases,
    loading,
    purchaseLoading,
    purchasePack,
    refresh: fetchPacks,
    refreshPurchases: fetchPurchases,
  };
}
