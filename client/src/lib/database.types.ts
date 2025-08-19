export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_articles: {
        Row: {
          author_id: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_promoted: boolean | null
          read_time: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          read_time: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          read_time?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string
          category: Database["public"]["Enums"]["business_category"]
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_premium: boolean | null
          is_promoted: boolean | null
          is_verified: boolean | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          category: Database["public"]["Enums"]["business_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_promoted?: boolean | null
          is_verified?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          category?: Database["public"]["Enums"]["business_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_promoted?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      council_data: {
        Row: {
          amount: number | null
          created_at: string
          data_type: Database["public"]["Enums"]["data_type"]
          date: string
          description: string | null
          id: string
          location: string | null
          metadata: Json | null
          source_url: string | null
          status: string | null
          title: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          data_type: Database["public"]["Enums"]["data_type"]
          date: string
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          source_url?: string | null
          status?: string | null
          title: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          data_type?: Database["public"]["Enums"]["data_type"]
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          source_url?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      forum_discussions: {
        Row: {
          author_id: string | null
          author_initials: string
          author_name: string
          category: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes: number | null
          reply_count: number | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          author_initials: string
          author_name: string
          category: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number | null
          reply_count?: number | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          author_initials?: string
          author_name?: string
          category?: Database["public"]["Enums"]["forum_category"]
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number | null
          reply_count?: number | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_discussions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string | null
          author_initials: string
          author_name: string
          content: string
          created_at: string
          discussion_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          author_initials: string
          author_name: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          author_initials?: string
          author_name?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "forum_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string
          id: string
          is_business_owner: boolean | null
          is_skill_provider: boolean | null
          phone: string | null
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at?: string
          id: string
          is_business_owner?: boolean | null
          is_skill_provider?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_business_owner?: boolean | null
          is_skill_provider?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expire: string
          sess: Json
          sid: string
        }
        Insert: {
          expire: string
          sess: Json
          sid: string
        }
        Update: {
          expire?: string
          sess?: Json
          sid?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          responses: Json
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          responses: Json
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          responses?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          ends_at: string | null
          id: string
          questions: Json
          response_count: number | null
          status: Database["public"]["Enums"]["survey_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          ends_at?: string | null
          id?: string
          questions: Json
          response_count?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          questions?: Json
          response_count?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string
          level: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          level?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          level?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_category:
        | "restaurant_cafe"
        | "retail_shopping"
        | "health_beauty"
        | "professional_services"
        | "home_garden"
        | "other"
      data_type:
        | "planning_application"
        | "council_spending"
        | "council_meeting"
        | "consultation"
        | "council_page"
        | "council_document"
        | "transparency_data"
        | "budget_item"
        | "spending_record"
        | "statistical_data"
        | "councillor"
        | "department"
        | "service"
        | "document"
        | "chart_data"
      forum_category:
        | "general"
        | "local_events"
        | "business_recommendations"
        | "council_planning"
        | "buy_sell"
        | "green_space"
      survey_status: "draft" | "active" | "closed"
      user_role: "user" | "moderator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
