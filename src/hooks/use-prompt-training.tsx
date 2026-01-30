import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromptTrainingPreferences {
  id?: string;
  preferred_tone: string;
  preferred_length: string;
  include_keywords: string[];
  exclude_keywords: string[];
  custom_instructions: string | null;
  training_strength: number;
}

export interface PromptExample {
  id: string;
  image_url: string | null;
  prompt_text: string;
  style: string;
  is_positive: boolean;
  notes: string | null;
  created_at: string;
}

export interface PromptFeedback {
  id: string;
  prompt_text: string;
  style: string;
  detail_level: string;
  rating: number;
  feedback_notes: string | null;
  created_at: string;
}

const DEFAULT_PREFERENCES: PromptTrainingPreferences = {
  preferred_tone: "neutral",
  preferred_length: "medium",
  include_keywords: [],
  exclude_keywords: [],
  custom_instructions: null,
  training_strength: 75,
};

export function usePromptTraining() {
  const [preferences, setPreferences] = useState<PromptTrainingPreferences>(DEFAULT_PREFERENCES);
  const [examples, setExamples] = useState<PromptExample[]>([]);
  const [feedback, setFeedback] = useState<PromptFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("prompt_training_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error);
      return;
    }

    if (data) {
      setPreferences({
        id: data.id,
        preferred_tone: data.preferred_tone || "neutral",
        preferred_length: data.preferred_length || "medium",
        include_keywords: data.include_keywords || [],
        exclude_keywords: data.exclude_keywords || [],
        custom_instructions: data.custom_instructions,
        training_strength: data.training_strength ?? 75,
      });
    }
  }, []);

  const fetchExamples = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("prompt_examples")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching examples:", error);
      return;
    }

    setExamples(data || []);
  }, []);

  const fetchFeedback = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("prompt_feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching feedback:", error);
      return;
    }

    setFeedback(data || []);
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchPreferences(), fetchExamples(), fetchFeedback()]);
      setIsLoading(false);
    };
    loadAll();
  }, [fetchPreferences, fetchExamples, fetchFeedback]);

  const savePreferences = async (newPrefs: Partial<PromptTrainingPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to save preferences");
      return false;
    }

    const updatedPrefs = { ...preferences, ...newPrefs };

    const { error } = await supabase
      .from("prompt_training_preferences")
      .upsert({
        user_id: user.id,
        preferred_tone: updatedPrefs.preferred_tone,
        preferred_length: updatedPrefs.preferred_length,
        include_keywords: updatedPrefs.include_keywords,
        exclude_keywords: updatedPrefs.exclude_keywords,
        custom_instructions: updatedPrefs.custom_instructions,
        training_strength: updatedPrefs.training_strength,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
      return false;
    }

    setPreferences(updatedPrefs);
    toast.success("Preferences saved");
    return true;
  };

  const addExample = async (example: {
    prompt_text: string;
    style: string;
    is_positive: boolean;
    image_url?: string;
    notes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to save examples");
      return false;
    }

    const { data, error } = await supabase
      .from("prompt_examples")
      .insert({
        user_id: user.id,
        prompt_text: example.prompt_text,
        style: example.style,
        is_positive: example.is_positive,
        image_url: example.image_url || null,
        notes: example.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding example:", error);
      toast.error("Failed to save example");
      return false;
    }

    setExamples(prev => [data, ...prev]);
    toast.success(example.is_positive ? "Saved as good example" : "Saved as bad example");
    return true;
  };

  const deleteExample = async (exampleId: string) => {
    const { error } = await supabase
      .from("prompt_examples")
      .delete()
      .eq("id", exampleId);

    if (error) {
      console.error("Error deleting example:", error);
      toast.error("Failed to delete example");
      return false;
    }

    setExamples(prev => prev.filter(e => e.id !== exampleId));
    toast.success("Example deleted");
    return true;
  };

  const addFeedback = async (feedbackData: {
    prompt_text: string;
    style: string;
    detail_level: string;
    rating: number;
    feedback_notes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to give feedback");
      return false;
    }

    const { data, error } = await supabase
      .from("prompt_feedback")
      .insert({
        user_id: user.id,
        prompt_text: feedbackData.prompt_text,
        style: feedbackData.style,
        detail_level: feedbackData.detail_level,
        rating: feedbackData.rating,
        feedback_notes: feedbackData.feedback_notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to save feedback");
      return false;
    }

    setFeedback(prev => [data, ...prev]);
    toast.success(feedbackData.rating === 1 ? "Thanks for the feedback! 👍" : "Thanks for the feedback! 👎");
    return true;
  };

  // Get training context for the AI (to be sent with prompt generation)
  const getTrainingContext = useCallback(() => {
    const positiveExamples = examples.filter(e => e.is_positive).slice(0, 3);
    const negativeExamples = examples.filter(e => !e.is_positive).slice(0, 2);
    const recentPositiveFeedback = feedback.filter(f => f.rating === 1).slice(0, 3);
    const recentNegativeFeedback = feedback.filter(f => f.rating === -1).slice(0, 2);

    return {
      trainingStrength: preferences.training_strength / 100, // Convert to 0-1 range
      preferences: {
        tone: preferences.preferred_tone,
        length: preferences.preferred_length,
        includeKeywords: preferences.include_keywords,
        excludeKeywords: preferences.exclude_keywords,
        customInstructions: preferences.custom_instructions,
      },
      positiveExamples: positiveExamples.map(e => ({
        prompt: e.prompt_text,
        style: e.style,
        notes: e.notes,
      })),
      negativeExamples: negativeExamples.map(e => ({
        prompt: e.prompt_text,
        style: e.style,
        notes: e.notes,
      })),
      likedPrompts: recentPositiveFeedback.map(f => f.prompt_text),
      dislikedPrompts: recentNegativeFeedback.map(f => f.prompt_text),
    };
  }, [preferences, examples, feedback]);

  const hasTrainingData = examples.length > 0 || feedback.length > 0 || 
    preferences.include_keywords.length > 0 || preferences.exclude_keywords.length > 0 ||
    preferences.custom_instructions;

  return {
    preferences,
    examples,
    feedback,
    isLoading,
    savePreferences,
    addExample,
    deleteExample,
    addFeedback,
    getTrainingContext,
    hasTrainingData,
    refresh: () => Promise.all([fetchPreferences(), fetchExamples(), fetchFeedback()]),
  };
}
