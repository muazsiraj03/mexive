import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { usePricing } from "@/hooks/use-pricing";

export interface Subscription {
  id: string;
  plan: string;
  status: "active" | "pending" | "canceled" | "expired";
  startedAt: Date;
  expiresAt: Date | null;
}

// Re-export PlanInfo for backward compatibility
export interface PlanInfo {
  name: string;
  displayName: string;
  price: number;
  period: string;
  credits: number;
  features: string[];
  popular?: boolean;
}

export function useSubscription() {
  const { plans: pricingPlans } = usePricing();
  
  // Convert to PlanInfo format for backward compatibility
  const plans: PlanInfo[] = pricingPlans.map(plan => ({
    name: plan.name,
    displayName: plan.displayName,
    price: plan.price,
    period: plan.period,
    credits: plan.credits,
    features: plan.features,
    popular: plan.isPopular,
  }));
  
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setSubscriptionHistory([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all subscriptions for history
      const { data: allSubs, error: historyError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (historyError) {
        console.error("Error fetching subscription history:", historyError);
      } else if (allSubs) {
        setSubscriptionHistory(
          allSubs.map((data) => ({
            id: data.id,
            plan: data.plan,
            status: data.status as Subscription["status"],
            startedAt: new Date(data.started_at),
            expiresAt: data.expires_at ? new Date(data.expires_at) : null,
          }))
        );
      }

      // Get current active/pending/canceled subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "pending", "canceled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return;
      }

      if (data) {
        setSubscription({
          id: data.id,
          plan: data.plan,
          status: data.status as Subscription["status"],
          startedAt: new Date(data.started_at),
          expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const subscribe = async (plan: string, requestedCredits?: number, requestedPrice?: number) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      return { success: false };
    }

    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Convert price to cents if provided
      const requestedPriceCents = requestedPrice ? requestedPrice * 100 : undefined;

      const response = await supabase.functions.invoke("manage-subscription", {
        body: { action: "subscribe", plan, requestedCredits, requestedPriceCents },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to subscribe");
      }

      const result = response.data;
      
      if (result.error) {
        toast.error(result.error);
        return { success: false };
      }

      toast.success(result.message || "Subscription request submitted!");
      await fetchSubscription();
      return { success: true };
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to submit subscription request");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const cancel = async () => {
    if (!user || !subscription) {
      toast.error("No active subscription to cancel");
      return { success: false };
    }

    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke("manage-subscription", {
        body: { action: "cancel" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to cancel");
      }

      const result = response.data;
      
      if (result.error) {
        toast.error(result.error);
        return { success: false };
      }

      toast.success(result.message || "Subscription canceled");
      await fetchSubscription();
      return { success: true };
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel subscription");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const getCurrentPlan = (): PlanInfo => {
    const planName = subscription?.status === "active" || subscription?.status === "canceled" 
      ? subscription.plan 
      : "free";
    return plans.find((p) => p.name === planName) || plans[0];
  };

  return {
    subscription,
    subscriptionHistory,
    loading,
    actionLoading,
    subscribe,
    cancel,
    refresh: fetchSubscription,
    getCurrentPlan,
    plans,
  };
}
