import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_purchase_cents: number;
  applicable_plans: string[];
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeFormData {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  min_purchase_cents?: number;
  applicable_plans?: string[];
  is_active?: boolean;
  expires_at?: string | null;
}

export function usePromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes((data as PromoCode[]) || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createPromoCode = async (data: PromoCodeFormData) => {
    try {
      const { error } = await supabase.from("promo_codes").insert({
        code: data.code.toUpperCase().trim(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_uses: data.max_uses || null,
        min_purchase_cents: data.min_purchase_cents || 0,
        applicable_plans: data.applicable_plans || [],
        is_active: data.is_active ?? true,
        expires_at: data.expires_at || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code created successfully",
      });
      await fetchPromoCodes();
      return true;
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePromoCode = async (id: string, data: Partial<PromoCodeFormData>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
      if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
      if (data.max_uses !== undefined) updateData.max_uses = data.max_uses || null;
      if (data.min_purchase_cents !== undefined) updateData.min_purchase_cents = data.min_purchase_cents;
      if (data.applicable_plans !== undefined) updateData.applicable_plans = data.applicable_plans;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.expires_at !== undefined) updateData.expires_at = data.expires_at || null;

      const { error } = await supabase
        .from("promo_codes")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code updated successfully",
      });
      await fetchPromoCodes();
      return true;
    } catch (error: any) {
      console.error("Error updating promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
      await fetchPromoCodes();
      return true;
    } catch (error: any) {
      console.error("Error deleting promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
      return false;
    }
  };

  const validatePromoCode = async (code: string, priceCents: number, planName?: string) => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return { valid: false, error: "Invalid promo code" };
      }

      const promo = data as PromoCode;

      // Check expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return { valid: false, error: "Promo code has expired" };
      }

      // Check max uses
      if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
        return { valid: false, error: "Promo code has reached maximum uses" };
      }

      // Check minimum purchase
      if (priceCents < promo.min_purchase_cents) {
        return { 
          valid: false, 
          error: `Minimum purchase of $${(promo.min_purchase_cents / 100).toFixed(2)} required` 
        };
      }

      // Check applicable plans
      if (promo.applicable_plans.length > 0 && planName && !promo.applicable_plans.includes(planName)) {
        return { valid: false, error: "Promo code not valid for this plan" };
      }

      // Calculate discount
      let discountAmount = 0;
      if (promo.discount_type === "percentage") {
        discountAmount = Math.round(priceCents * (promo.discount_value / 100));
      } else {
        discountAmount = promo.discount_value;
      }

      // Don't exceed the price
      discountAmount = Math.min(discountAmount, priceCents);

      return {
        valid: true,
        promo,
        discountAmount,
        finalPrice: priceCents - discountAmount,
      };
    } catch (error) {
      console.error("Error validating promo code:", error);
      return { valid: false, error: "Failed to validate promo code" };
    }
  };

  const incrementPromoCodeUse = async (id: string) => {
    try {
      const { data: current } = await supabase
        .from("promo_codes")
        .select("current_uses")
        .eq("id", id)
        .single();

      if (current) {
        await supabase
          .from("promo_codes")
          .update({ current_uses: (current.current_uses || 0) + 1 })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Error incrementing promo code use:", error);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  return {
    promoCodes,
    loading,
    fetchPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    incrementPromoCodeUse,
  };
}
