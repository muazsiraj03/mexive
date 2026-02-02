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
      benefits: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          tool: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          tool?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          is_published: boolean
          published_at: string | null
          read_time_minutes: number
          slug: string
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number
          slug: string
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number
          slug?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comparisons: {
        Row: {
          ai_value: string
          aspect: string
          created_at: string
          id: string
          is_active: boolean
          manual_value: string
          sort_order: number
          tool: string
          updated_at: string
        }
        Insert: {
          ai_value: string
          aspect: string
          created_at?: string
          id?: string
          is_active?: boolean
          manual_value: string
          sort_order?: number
          tool?: string
          updated_at?: string
        }
        Update: {
          ai_value?: string
          aspect?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manual_value?: string
          sort_order?: number
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_pack_purchases: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          credits: number
          id: string
          notes: string | null
          pack_id: string | null
          pack_name: string | null
          payment_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_account: string | null
          sender_name: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          credits: number
          id?: string
          notes?: string | null
          pack_id?: string | null
          pack_name?: string | null
          payment_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          credits?: number
          id?: string
          notes?: string | null
          pack_id?: string | null
          pack_name?: string | null
          payment_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_pack_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          bonus_credits: number
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          bonus_credits?: number
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_cents: number
          sort_order?: number
        }
        Update: {
          bonus_credits?: number
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      credit_tiers: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          plan_name: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          plan_name: string
          price_cents: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          plan_name?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          tool: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          tool?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          tool?: string
          updated_at?: string
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
          image_url: string | null
          issues: Json
          marketplace_notes: Json
          overall_score: number
          suggestions: string[]
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          image_url?: string | null
          issues?: Json
          marketplace_notes?: Json
          overall_score?: number
          suggestions?: string[]
          user_id: string
          verdict?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          image_url?: string | null
          issues?: Json
          marketplace_notes?: Json
          overall_score?: number
          suggestions?: string[]
          user_id?: string
          verdict?: string
        }
        Relationships: []
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
        Relationships: []
      }
      generation_marketplaces: {
        Row: {
          created_at: string
          description: string | null
          generation_id: string
          id: string
          keywords: string[]
          marketplace_name: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          generation_id: string
          id?: string
          keywords?: string[]
          marketplace_name: string
          title: string
        }
        Update: {
          created_at?: string
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
            foreignKeyName: "fk_generations_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "generation_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      how_it_works: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          step_number: string
          title: string
          tool: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          step_number?: string
          title: string
          tool?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          step_number?: string
          title?: string
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_stats: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      metadata_generations: {
        Row: {
          batch_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          id: string
          image_url: string | null
          keywords: string[] | null
          marketplace: string | null
          metadata: Json | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          marketplace?: string | null
          metadata?: Json | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          marketplace?: string | null
          metadata?: Json | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          created_at: string
          credits: number
          daily_credit_reset: boolean
          display_name: string
          features: string[]
          id: string
          is_active: boolean
          is_popular: boolean
          is_unlimited: boolean
          period: string
          plan_name: string
          price_cents: number
          sort_order: number
          tools_access: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number
          daily_credit_reset?: boolean
          display_name: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          is_unlimited?: boolean
          period?: string
          plan_name: string
          price_cents?: number
          sort_order?: number
          tools_access?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          daily_credit_reset?: boolean
          display_name?: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          is_unlimited?: boolean
          period?: string
          plan_name?: string
          price_cents?: number
          sort_order?: number
          tools_access?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase_cents: number | null
          updated_at: string
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
          updated_at?: string
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_examples: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_positive: boolean
          notes: string | null
          prompt_text: string
          style: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_positive?: boolean
          notes?: string | null
          prompt_text: string
          style?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_positive?: boolean
          notes?: string | null
          prompt_text?: string
          style?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_feedback: {
        Row: {
          created_at: string
          detail_level: string
          feedback_notes: string | null
          id: string
          prompt_text: string
          rating: number
          style: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail_level: string
          feedback_notes?: string | null
          id?: string
          prompt_text: string
          rating: number
          style: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail_level?: string
          feedback_notes?: string | null
          id?: string
          prompt_text?: string
          rating?: number
          style?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_history: {
        Row: {
          art_style: string | null
          aspect_ratio: string | null
          created_at: string
          detail_level: string | null
          dominant_colors: string[] | null
          id: string
          image_url: string
          negative_prompt: string | null
          prompt: string
          style: string | null
          training_snapshot: Json | null
          user_id: string
        }
        Insert: {
          art_style?: string | null
          aspect_ratio?: string | null
          created_at?: string
          detail_level?: string | null
          dominant_colors?: string[] | null
          id?: string
          image_url: string
          negative_prompt?: string | null
          prompt: string
          style?: string | null
          training_snapshot?: Json | null
          user_id: string
        }
        Update: {
          art_style?: string | null
          aspect_ratio?: string | null
          created_at?: string
          detail_level?: string | null
          dominant_colors?: string[] | null
          id?: string
          image_url?: string
          negative_prompt?: string | null
          prompt?: string
          style?: string | null
          training_snapshot?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      prompt_training_preferences: {
        Row: {
          created_at: string
          custom_instructions: string | null
          exclude_keywords: string[]
          id: string
          include_keywords: string[]
          preferred_length: string
          preferred_tone: string
          training_strength: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_instructions?: string | null
          exclude_keywords?: string[]
          id?: string
          include_keywords?: string[]
          preferred_length?: string
          preferred_tone?: string
          training_strength?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_instructions?: string | null
          exclude_keywords?: string[]
          id?: string
          include_keywords?: string[]
          preferred_length?: string
          preferred_tone?: string
          training_strength?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          cap_period: string | null
          created_at: string
          id: string
          is_active: boolean
          max_referrals_per_user: number | null
          referee_reward_credits: number
          referrer_reward_credits: number
          reward_trigger: string
          updated_at: string
        }
        Insert: {
          cap_period?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          referee_reward_credits?: number
          referrer_reward_credits?: number
          reward_trigger?: string
          updated_at?: string
        }
        Update: {
          cap_period?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          referee_reward_credits?: number
          referrer_reward_credits?: number
          reward_trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string
          referee_reward_credits: number
          referral_code: string
          referrer_id: string
          referrer_reward_credits: number
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id: string
          referee_reward_credits?: number
          referral_code: string
          referrer_id: string
          referrer_reward_credits?: number
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string
          referee_reward_credits?: number
          referral_code?: string
          referrer_id?: string
          referrer_reward_credits?: number
          rewarded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          bonus_credits: number
          created_at: string
          credits_remaining: number
          credits_total: number
          expires_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          plan: string
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_credits?: number
          created_at?: string
          credits_remaining?: number
          credits_total?: number
          expires_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_credits?: number
          created_at?: string
          credits_remaining?: number
          credits_total?: number
          expires_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          rating: number
          role: string
          sort_order: number
          tool: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rating?: number
          role: string
          sort_order?: number
          tool: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rating?: number
          role?: string
          sort_order?: number
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_presets: {
        Row: {
          category: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_intent_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      upgrade_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_proof_url: string | null
          plan_name: string
          requested_credits: number | null
          requested_price_cents: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_account: string | null
          sender_name: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_proof_url?: string | null
          plan_name: string
          requested_credits?: number | null
          requested_price_cents?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_proof_url?: string | null
          plan_name?: string
          requested_credits?: number | null
          requested_price_cents?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_reads: {
        Row: {
          created_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_referral_code: {
        Args: { p_full_name: string; p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_bonus_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
