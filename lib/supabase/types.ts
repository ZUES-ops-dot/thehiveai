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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      automation_logs: {
        Row: {
          action: string
          entity_id: string
          id: string
          metadata: Json | null
          platform: string
          result: Json | null
          run_at: string | null
          run_by: string | null
          status: string
        }
        Insert: {
          action: string
          entity_id: string
          id?: string
          metadata?: Json | null
          platform: string
          result?: Json | null
          run_at?: string | null
          run_by?: string | null
          status?: string
        }
        Update: {
          action?: string
          entity_id?: string
          id?: string
          metadata?: Json | null
          platform?: string
          result?: Json | null
          run_at?: string | null
          run_by?: string | null
          status?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          project_tag: string
          reward_pool: number | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          project_tag: string
          reward_pool?: number | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          project_tag?: string
          reward_pool?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          active: boolean | null
          connected_at: string | null
          display_name: string
          followers_count: number | null
          handle: string
          id: string
          owner_user_id: string
          profile_image_url: string | null
          updated_at: string | null
          x_user_id: string
        }
        Insert: {
          active?: boolean | null
          connected_at?: string | null
          display_name: string
          followers_count?: number | null
          handle: string
          id?: string
          owner_user_id: string
          profile_image_url?: string | null
          updated_at?: string | null
          x_user_id: string
        }
        Update: {
          active?: boolean | null
          connected_at?: string | null
          display_name?: string
          followers_count?: number | null
          handle?: string
          id?: string
          owner_user_id?: string
          profile_image_url?: string | null
          updated_at?: string | null
          x_user_id?: string
        }
        Relationships: []
      }
      integration_cache: {
        Row: {
          expires_at: string
          key: string
          payload: Json
        }
        Insert: {
          expires_at: string
          key: string
          payload: Json
        }
        Update: {
          expires_at?: string
          key?: string
          payload?: Json
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          awarded_to_msp: boolean
          created_at: string
          id: string
          invitee_user_id: string
          invitee_username: string | null
          inviter_user_id: string
          inviter_username: string | null
          msp_awarded: number
        }
        Insert: {
          awarded_to_msp?: boolean
          created_at?: string
          id?: string
          invitee_user_id: string
          invitee_username?: string | null
          inviter_user_id: string
          inviter_username?: string | null
          msp_awarded?: number
        }
        Update: {
          awarded_to_msp?: boolean
          created_at?: string
          id?: string
          invitee_user_id?: string
          invitee_username?: string | null
          inviter_user_id?: string
          inviter_username?: string | null
          msp_awarded?: number
        }
        Relationships: []
      }
      narrative_analytics: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          insight_notes: string | null
          keywords: Json | null
          last_synced: string | null
          sponsor_pool: Json | null
          top_accounts: Json | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          insight_notes?: string | null
          keywords?: Json | null
          last_synced?: string | null
          sponsor_pool?: Json | null
          top_accounts?: Json | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          insight_notes?: string | null
          keywords?: Json | null
          last_synced?: string | null
          sponsor_pool?: Json | null
          top_accounts?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_sponsors: {
        Row: {
          amount: number | null
          campaign_id: string
          created_at: string | null
          id: string
          logo_url: string | null
          metadata: Json | null
          sponsor_name: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          campaign_id: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          sponsor_name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          sponsor_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_sponsors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          campaign_id: string
          display_name: string
          engagement_rate: number | null
          followers_count: number | null
          id: string
          joined_at: string | null
          msp: number | null
          post_count: number | null
          profile_image_url: string | null
          rank: number | null
          updated_at: string | null
          user_id: string
          username: string
          virality_score: number | null
          wallet_address: string | null
        }
        Insert: {
          campaign_id: string
          display_name: string
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          joined_at?: string | null
          msp?: number | null
          post_count?: number | null
          profile_image_url?: string | null
          rank?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          virality_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          campaign_id?: string
          display_name?: string
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          joined_at?: string | null
          msp?: number | null
          post_count?: number | null
          profile_image_url?: string | null
          rank?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          virality_score?: number | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      post_events: {
        Row: {
          campaign_id: string
          content: string
          id: string
          likes: number | null
          msp: number | null
          posted_at: string
          quotes: number | null
          replies: number | null
          retweets: number | null
          tracked_at: string | null
          tweet_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          id?: string
          likes?: number | null
          msp?: number | null
          posted_at: string
          quotes?: number | null
          replies?: number | null
          retweets?: number | null
          tracked_at?: string | null
          tweet_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          id?: string
          likes?: number | null
          msp?: number | null
          posted_at?: string
          quotes?: number | null
          replies?: number | null
          retweets?: number | null
          tracked_at?: string | null
          tweet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_state: {
        Row: {
          campaign_id: string
          last_run_at: string | null
          last_tweet_id: string | null
          total_posts_tracked: number | null
        }
        Insert: {
          campaign_id: string
          last_run_at?: string | null
          last_tweet_id?: string | null
          total_posts_tracked?: number | null
        }
        Update: {
          campaign_id?: string
          last_run_at?: string | null
          last_tweet_id?: string | null
          total_posts_tracked?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_state_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          msp_awarded: number
          period_start: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          msp_awarded?: number
          period_start: string
          progress?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          msp_awarded?: number
          period_start?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_login_date: string
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_login_date: string
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_login_date?: string
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_campaign_history: {
        Row: {
          campaign_id: string
          first_joined_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          first_joined_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          first_joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campaign_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          payload: Json
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload: Json
          source: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_connected_account_ids: {
        Args: { p_owner_user_id: string }
        Returns: string[]
      }
      increment_participant_stats: {
        Args: {
          p_campaign_id: string
          p_msp_delta: number
          p_post_count_delta?: number
          p_user_id: string
        }
        Returns: undefined
      }
      recalculate_campaign_ranks: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// Convenience row types
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']
export type PostEvent = Database['public']['Tables']['post_events']['Row']
export type TrackingState = Database['public']['Tables']['tracking_state']['Row']
export type ConnectedAccount = Database['public']['Tables']['connected_accounts']['Row']
export type NarrativeAnalytics = Database['public']['Tables']['narrative_analytics']['Row']
export type NarrativeSponsor = Database['public']['Tables']['narrative_sponsors']['Row']
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row']
export type WorkspaceBookmark = Database['public']['Tables']['workspace_bookmarks']['Row']
export type IntegrationCache = Database['public']['Tables']['integration_cache']['Row']
export type InviteRedemption = Database['public']['Tables']['invite_redemptions']['Row']
export type UserMission = Database['public']['Tables']['user_missions']['Row']
export type UserStreak = Database['public']['Tables']['user_streaks']['Row']
export type UserCampaignHistory = Database['public']['Tables']['user_campaign_history']['Row']
