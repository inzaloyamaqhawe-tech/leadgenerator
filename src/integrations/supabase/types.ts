export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      lead_activity: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          lead_id: string;
          text: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          lead_id: string;
          text: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          lead_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activity_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_photos_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          address: string | null;
          brand: string | null;
          business_name: string;
          contact_person: string | null;
          created_at: string;
          created_by: string | null;
          electricity_provider: string | null;
          email: string | null;
          energy_profile: string | null;
          id: string;
          industry: string;
          lat: number | null;
          lng: number | null;
          marketing_consent: string | null;
          notes: string | null;
          owner_operator: string | null;
          owner_user: string | null;
          phone: string | null;
          roof_area_m2: number | null;
          rooftop_solar: string;
          score: number | null;
          source_url: string | null;
          standalone: boolean | null;
          status: string;
          suburb: string | null;
          tier: string | null;
          township: string;
          updated_at: string;
          utility_confidence: string | null;
          utility_confirmed: string | null;
          utility_rule: string | null;
          utility_source: string | null;
          water_provider: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          brand?: string | null;
          business_name: string;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          electricity_provider?: string | null;
          email?: string | null;
          energy_profile?: string | null;
          id: string;
          industry: string;
          lat?: number | null;
          lng?: number | null;
          marketing_consent?: string | null;
          notes?: string | null;
          owner_operator?: string | null;
          owner_user?: string | null;
          phone?: string | null;
          roof_area_m2?: number | null;
          rooftop_solar?: string;
          score?: number | null;
          source_url?: string | null;
          standalone?: boolean | null;
          status?: string;
          suburb?: string | null;
          tier?: string | null;
          township: string;
          updated_at?: string;
          utility_confidence?: string | null;
          utility_confirmed?: string | null;
          utility_rule?: string | null;
          utility_source?: string | null;
          water_provider?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          brand?: string | null;
          business_name?: string;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          electricity_provider?: string | null;
          email?: string | null;
          energy_profile?: string | null;
          id?: string;
          industry?: string;
          lat?: number | null;
          lng?: number | null;
          marketing_consent?: string | null;
          notes?: string | null;
          owner_operator?: string | null;
          owner_user?: string | null;
          phone?: string | null;
          roof_area_m2?: number | null;
          rooftop_solar?: string;
          score?: number | null;
          source_url?: string | null;
          standalone?: boolean | null;
          status?: string;
          suburb?: string | null;
          tier?: string | null;
          township?: string;
          updated_at?: string;
          utility_confidence?: string | null;
          utility_confirmed?: string | null;
          utility_rule?: string | null;
          utility_source?: string | null;
          water_provider?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_owner_user_fkey";
            columns: ["owner_user"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          team: string;
        };
        Insert: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          team?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          team?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      utility_context: {
        Row: {
          created_at: string;
          id: string;
          reliability: string | null;
          source_url: string | null;
          sseg_rules: string | null;
          tariff_increase: string | null;
          utility: string;
          verify_how: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reliability?: string | null;
          source_url?: string | null;
          sseg_rules?: string | null;
          tariff_increase?: string | null;
          utility: string;
          verify_how?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          reliability?: string | null;
          source_url?: string | null;
          sseg_rules?: string | null;
          tariff_increase?: string | null;
          utility?: string;
          verify_how?: string | null;
        };
        Relationships: [];
      };
      utility_rules: {
        Row: {
          confidence: string | null;
          created_at: string;
          electricity_provider: string | null;
          id: string;
          note: string | null;
          source_url: string | null;
          suburb_or_zone: string;
          township: string;
          water_provider: string | null;
        };
        Insert: {
          confidence?: string | null;
          created_at?: string;
          electricity_provider?: string | null;
          id?: string;
          note?: string | null;
          source_url?: string | null;
          suburb_or_zone?: string;
          township: string;
          water_provider?: string | null;
        };
        Update: {
          confidence?: string | null;
          created_at?: string;
          electricity_provider?: string | null;
          id?: string;
          note?: string | null;
          source_url?: string | null;
          suburb_or_zone?: string;
          township?: string;
          water_provider?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_active: { Args: { _user_id: string }; Returns: boolean };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "member" | "viewer";
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
      app_role: ["admin", "member", "viewer"],
    },
  },
} as const;
