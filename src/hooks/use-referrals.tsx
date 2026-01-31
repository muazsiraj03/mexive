import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: string;
  referrer_reward_credits: number;
  referee_reward_credits: number;
  rewarded_at: string | null;
  created_at: string;
}

export interface ReferralSettings {
  id: string;
  referrer_reward_credits: number;
  referee_reward_credits: number;
  reward_trigger: string;
  max_referrals_per_user: number | null;
  cap_period: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
}

export function useReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's referral code
  const { data: referralCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First, check if user has a referral code
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no code exists, generate one
      if (!data) {
        // Get user's profile for name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        
        // Generate code using the database function
        const { data: generatedCode, error: genError } = await supabase
          .rpc("generate_referral_code", {
            p_user_id: user.id,
            p_full_name: profile?.full_name || user.email || "USER"
          });
        
        if (genError) throw genError;
        
        // Insert the new referral code
        const { data: newCode, error: insertError } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code: generatedCode })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newCode as ReferralCode;
      }
      
      return data as ReferralCode;
    },
    enabled: !!user?.id,
  });

  // Fetch user's referrals (where they are the referrer)
  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user?.id,
  });

  // Fetch referral settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_settings")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      // Return default settings if none exist
      return data as ReferralSettings | null;
    },
  });

  // Calculate stats
  const stats: ReferralStats = {
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter(r => r.status === "completed").length,
    pendingReferrals: referrals.filter(r => r.status === "pending").length,
    totalCreditsEarned: referrals
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + r.referrer_reward_credits, 0),
  };

  // Update referral code
  const updateCodeMutation = useMutation({
    mutationFn: async (newCode: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Check if code already exists
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("code", newCode.toUpperCase())
        .neq("user_id", user.id)
        .single();
      
      if (existing) {
        throw new Error("This code is already taken");
      }

      const { error } = await supabase
        .from("referral_codes")
        .update({ code: newCode.toUpperCase() })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-code"] });
      toast.success("Referral code updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getReferralLink = () => {
    if (!referralCode?.code) return "";
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${referralCode.code}`;
  };

  return {
    referralCode,
    referrals,
    settings,
    stats,
    isLoading: isLoadingCode || isLoadingReferrals || isLoadingSettings,
    updateCode: updateCodeMutation.mutate,
    isUpdatingCode: updateCodeMutation.isPending,
    getReferralLink,
  };
}

// Admin hook for managing referrals
export function useAdminReferrals() {
  const queryClient = useQueryClient();

  // Fetch all referrals (admin only)
  const { data: allReferrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
  });

  // Fetch all referral codes (admin only)
  const { data: allCodes = [], isLoading: isLoadingCodes } = useQuery({
    queryKey: ["admin-referral-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ReferralCode[];
    },
  });

  // Fetch referral settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data as ReferralSettings;
    },
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<ReferralSettings>) => {
      const { error } = await supabase
        .from("referral_settings")
        .update(updates)
        .eq("id", settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-settings"] });
      toast.success("Referral settings updated!");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  // Calculate admin stats
  const adminStats = {
    totalReferrals: allReferrals.length,
    completedReferrals: allReferrals.filter(r => r.status === "completed").length,
    pendingReferrals: allReferrals.filter(r => r.status === "pending").length,
    totalCreditsDistributed: allReferrals
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + r.referrer_reward_credits + r.referee_reward_credits, 0),
    conversionRate: allReferrals.length > 0 
      ? Math.round((allReferrals.filter(r => r.status === "completed").length / allReferrals.length) * 100)
      : 0,
  };

  return {
    allReferrals,
    allCodes,
    settings,
    adminStats,
    isLoading: isLoadingReferrals || isLoadingCodes || isLoadingSettings,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
}
