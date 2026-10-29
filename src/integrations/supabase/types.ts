export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      consents: {
        Row: {
          accepted_at: string;
          terms_version: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          terms_version: string;
          user_id?: string;
        };
        Update: {
          accepted_at?: string;
          terms_version?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exam_corrections: {
        Row: {
          correction: Json;
          created_at: string;
          id: string;
          optical_score: number | null;
          source_mode: string;
          subject_id: string | null;
          subject_name: string;
          tier_at_creation: string | null;
          title: string | null;
          user_id: string;
        };
        Insert: {
          correction?: Json;
          created_at?: string;
          id?: string;
          optical_score?: number | null;
          source_mode: string;
          subject_id?: string | null;
          subject_name: string;
          tier_at_creation?: string | null;
          title?: string | null;
          user_id?: string;
        };
        Update: {
          correction?: Json;
          created_at?: string;
          id?: string;
          optical_score?: number | null;
          source_mode?: string;
          subject_id?: string | null;
          subject_name?: string;
          tier_at_creation?: string | null;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          academic_goal: string | null;
          academic_status: string | null;
          avatar_url: string | null;
          created_at: string;
          domain_pole: string | null;
          email: string | null;
          faculty_code: string | null;
          first_name: string | null;
          full_name: string | null;
          grade_level: string | null;
          id: string;
          is_blocked: boolean;
          onboarding_completed: boolean;
          program_id: string | null;
          secondary_track: string | null;
          specialty: string | null;
          university_id: string | null;
          university_level: string | null;
          university_name: string | null;
          updated_at: string;
        };
        Insert: {
          academic_goal?: string | null;
          academic_status?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          domain_pole?: string | null;
          email?: string | null;
          faculty_code?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          grade_level?: string | null;
          id: string;
          is_blocked?: boolean;
          onboarding_completed?: boolean;
          program_id?: string | null;
          secondary_track?: string | null;
          specialty?: string | null;
          university_id?: string | null;
          university_level?: string | null;
          university_name?: string | null;
          updated_at?: string;
        };
        Update: {
          academic_goal?: string | null;
          academic_status?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          domain_pole?: string | null;
          email?: string | null;
          faculty_code?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          grade_level?: string | null;
          id?: string;
          is_blocked?: boolean;
          onboarding_completed?: boolean;
          program_id?: string | null;
          secondary_track?: string | null;
          specialty?: string | null;
          university_id?: string | null;
          university_level?: string | null;
          university_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          expires_at: string | null;
          monthly_exams_used: number;
          tier: Database["public"]["Enums"]["subscription_tier"];
          updated_at: string;
          usage_month: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          monthly_exams_used?: number;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          usage_month?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          monthly_exams_used?: number;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          usage_month?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      usage_counters: {
        Row: {
          kind: string;
          updated_at: string;
          usage_month: string;
          used: number;
          user_id: string;
        };
        Insert: {
          kind: string;
          updated_at?: string;
          usage_month: string;
          used?: number;
          user_id: string;
        };
        Update: {
          kind?: string;
          updated_at?: string;
          usage_month?: string;
          used?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_quota: { Args: { _kind: string }; Returns: Json };
      current_tier: { Args: { _uid: string }; Returns: string };
      get_my_quota: { Args: never; Returns: Json };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      plan_limit: { Args: { _tier: string }; Returns: number };
      refund_quota_for: {
        Args: { _kind: string; _uid: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
      subscription_tier: "FREE" | "PREMIUM" | "MASTER" | "BASIC" | "PRO";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      subscription_tier: ["FREE", "PREMIUM", "MASTER", "BASIC", "PRO"],
    },
  },
} as const;
