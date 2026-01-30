import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RejectionReason {
  message: string;
  severity: "high" | "medium" | "low";
  category: string;
  enabled: boolean;
}

export interface MarketplaceRule {
  min_resolution: number;
  min_dimension: number;
  allowed_formats: string[];
  notes: string;
}

export interface ScoringWeights {
  visual_quality: number;
  technical: number;
  content: number;
  commercial: number;
}

export interface FileReviewerConfig {
  id: string;
  rejection_reasons: Record<string, Record<string, RejectionReason>>;
  marketplace_rules: Record<string, MarketplaceRule>;
  scoring_weights: ScoringWeights;
  pass_threshold: number;
  warning_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFileReviewerConfig() {
  const [config, setConfig] = useState<FileReviewerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("file_reviewer_config")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No config found
          setConfig(null);
        } else {
          throw error;
        }
      } else {
        setConfig(data as unknown as FileReviewerConfig);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<FileReviewerConfig>) => {
    if (!config) return false;
    
    setIsSaving(true);
    try {
      // Convert to JSON-compatible format for Supabase
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.rejection_reasons !== undefined) {
        dbUpdates.rejection_reasons = updates.rejection_reasons;
      }
      if (updates.marketplace_rules !== undefined) {
        dbUpdates.marketplace_rules = updates.marketplace_rules;
      }
      if (updates.scoring_weights !== undefined) {
        dbUpdates.scoring_weights = updates.scoring_weights;
      }
      if (updates.pass_threshold !== undefined) {
        dbUpdates.pass_threshold = updates.pass_threshold;
      }
      if (updates.warning_threshold !== undefined) {
        dbUpdates.warning_threshold = updates.warning_threshold;
      }
      if (updates.is_active !== undefined) {
        dbUpdates.is_active = updates.is_active;
      }

      const { error } = await supabase
        .from("file_reviewer_config")
        .update(dbUpdates)
        .eq("id", config.id);

      if (error) throw error;

      setConfig((prev) => prev ? { ...prev, ...updates } : null);
      toast.success("Configuration saved");
      return true;
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRejectionReason = async (
    fileType: string,
    code: string,
    updates: Partial<RejectionReason>
  ) => {
    if (!config) return false;

    const updatedReasons = {
      ...config.rejection_reasons,
      [fileType]: {
        ...config.rejection_reasons[fileType],
        [code]: {
          ...config.rejection_reasons[fileType]?.[code],
          ...updates,
        },
      },
    };

    return updateConfig({ rejection_reasons: updatedReasons });
  };

  const addRejectionReason = async (
    fileType: string,
    code: string,
    reason: RejectionReason
  ) => {
    if (!config) return false;

    const updatedReasons = {
      ...config.rejection_reasons,
      [fileType]: {
        ...config.rejection_reasons[fileType],
        [code]: reason,
      },
    };

    return updateConfig({ rejection_reasons: updatedReasons });
  };

  const deleteRejectionReason = async (fileType: string, code: string) => {
    if (!config) return false;

    const updatedReasons = { ...config.rejection_reasons };
    if (updatedReasons[fileType]) {
      delete updatedReasons[fileType][code];
    }

    return updateConfig({ rejection_reasons: updatedReasons });
  };

  const updateMarketplaceRule = async (
    marketplace: string,
    updates: Partial<MarketplaceRule>
  ) => {
    if (!config) return false;

    const updatedRules = {
      ...config.marketplace_rules,
      [marketplace]: {
        ...config.marketplace_rules[marketplace],
        ...updates,
      },
    };

    return updateConfig({ marketplace_rules: updatedRules });
  };

  const updateScoringWeights = async (weights: ScoringWeights) => {
    return updateConfig({ scoring_weights: weights });
  };

  const updateThresholds = async (pass: number, warning: number) => {
    return updateConfig({ pass_threshold: pass, warning_threshold: warning });
  };

  return {
    config,
    isLoading,
    isSaving,
    fetchConfig,
    updateConfig,
    updateRejectionReason,
    addRejectionReason,
    deleteRejectionReason,
    updateMarketplaceRule,
    updateScoringWeights,
    updateThresholds,
  };
}
