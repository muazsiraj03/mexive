export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_pack_purchases: {
        Row: {
          amount: number
          created_at: string | null
          credits: number
          currency: string | null
          id: string
          payment_reference: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits: number
          currency?: string | null
          id?: string
          payment_reference?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits?: number
          currency?: string | null
          id?: string
          payment_reference?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          bonus_credits: number | null
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_cents: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_cents: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_tiers: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          plan_name: string
          price_cents: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          plan_name: string
          price_cents: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          plan_name?: string
          price_cents?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      file_reviewer_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          marketplace_rules: Json
          pass_threshold: number
          rejection_reasons: Json
          scoring_weights: Json
          updated_at: string
          warning_threshold: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace_rules?: Json
          pass_threshold?: number
          rejection_reasons?: Json
          scoring_weights?: Json
          updated_at?: string
          warning_threshold?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace_rules?: Json
          pass_threshold?: number
          rejection_reasons?: Json
          scoring_weights?: Json
          updated_at?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      file_reviews: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          id: string
          image_url: string
          issues: Json
          marketplace_notes: Json
          overall_score: number
          suggestions: Json
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          image_url: string
          issues?: Json
          marketplace_notes?: Json
          overall_score?: number
          suggestions?: Json
          user_id: string
          verdict?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          image_url?: string
          issues?: Json
          marketplace_notes?: Json
          overall_score?: number
          suggestions?: Json
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_batches: {
        Row: {
          created_at: string
          file_count: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_count?: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_count?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_marketplaces: {
        Row: {
          description: string | null
          generation_id: string
          id: string
          keywords: string[]
          marketplace_name: string
          title: string
        }
        Insert: {
          description?: string | null
          generation_id: string
          id?: string
          keywords?: string[]
          marketplace_name: string
          title: string
        }
        Update: {
          description?: string | null
          generation_id?: string
          id?: string
          keywords?: string[]
          marketplace_name?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_marketplaces_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          batch_id: string | null
          created_at: string
          display_name: string | null
          file_name: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          display_name?: string | null
          file_name: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          display_name?: string | null
          file_name?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "generation_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          created_at: string | null
          credits: number
          daily_credit_reset: boolean
          display_name: string
          features: string[]
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_unlimited: boolean
          period: string | null
          plan_name: string
          price_cents: number
          sort_order: number | null
          tools_access: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number
          daily_credit_reset?: boolean
          display_name: string
          features?: string[]
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_unlimited?: boolean
          period?: string | null
          plan_name: string
          price_cents?: number
          sort_order?: number | null
          tools_access?: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          daily_credit_reset?: boolean
          display_name?: string
          features?: string[]
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_unlimited?: boolean
          period?: string | null
          plan_name?: string
          price_cents?: number
          sort_order?: number | null
          tools_access?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          full_name: string | null
          has_unlimited_credits: boolean
          id: string
          last_credit_reset: string | null
          plan: string
          total_credits: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          has_unlimited_credits?: boolean
          id: string
          last_credit_reset?: string | null
          plan?: string
          total_credits?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          has_unlimited_credits?: boolean
          id?: string
          last_credit_reset?: string | null
          plan?: string
          total_credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      prompt_examples: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_positive: boolean | null
          notes: string | null
          prompt_text: string
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_positive?: boolean | null
          notes?: string | null
          prompt_text: string
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_positive?: boolean | null
          notes?: string | null
          prompt_text?: string
          style?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_feedback: {
        Row: {
          created_at: string | null
          detail_level: string | null
          feedback_notes: string | null
          id: string
          prompt_text: string
          rating: number | null
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detail_level?: string | null
          feedback_notes?: string | null
          id?: string
          prompt_text: string
          rating?: number | null
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detail_level?: string | null
          feedback_notes?: string | null
          id?: string
          prompt_text?: string
          rating?: number | null
          style?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_history: {
        Row: {
          art_style: string | null
          aspect_ratio: string | null
          created_at: string
          detail_level: string
          dominant_colors: string[] | null
          id: string
          image_url: string
          negative_prompt: string | null
          prompt: string
          style: string
          training_snapshot: Json | null
          user_id: string
        }
        Insert: {
          art_style?: string | null
          aspect_ratio?: string | null
          created_at?: string
          detail_level?: string
          dominant_colors?: string[] | null
          id?: string
          image_url: string
          negative_prompt?: string | null
          prompt: string
          style?: string
          training_snapshot?: Json | null
          user_id: string
        }
        Update: {
          art_style?: string | null
          aspect_ratio?: string | null
          created_at?: string
          detail_level?: string
          dominant_colors?: string[] | null
          id?: string
          image_url?: string
          negative_prompt?: string | null
          prompt?: string
          style?: string
          training_snapshot?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_training_preferences: {
        Row: {
          created_at: string | null
          custom_instructions: string | null
          exclude_keywords: string[] | null
          id: string
          include_keywords: string[] | null
          preferred_length: string | null
          preferred_tone: string | null
          training_strength: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_instructions?: string | null
          exclude_keywords?: string[] | null
          id?: string
          include_keywords?: string[] | null
          preferred_length?: string | null
          preferred_tone?: string | null
          training_strength?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_instructions?: string | null
          exclude_keywords?: string[] | null
          id?: string
          include_keywords?: string[] | null
          preferred_length?: string | null
          preferred_tone?: string | null
          training_strength?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_training_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          requested_credits: number | null
          requested_price_cents: number | null
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          requested_credits?: number | null
          requested_price_cents?: number | null
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          requested_credits?: number | null
          requested_price_cents?: number | null
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      training_presets: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          status: string
          stripe_payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type: "info" | "success" | "warning" | "error" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      notification_type: ["info", "success", "warning", "error", "system"],
    },
  },
} as const
