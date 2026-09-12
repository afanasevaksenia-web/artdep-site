export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_members: {
        Row: { chat_id: string; user_id: string }
        Insert: { chat_id: string; user_id: string }
        Update: { chat_id?: string; user_id?: string }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          dept: Database["public"]["Enums"]["dept_enum"] | null
          id: string
          kind: Database["public"]["Enums"]["chat_kind_enum"]
          project_id: string
        }
        Insert: {
          created_at?: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          id?: string
          kind: Database["public"]["Enums"]["chat_kind_enum"]
          project_id: string
        }
        Update: {
          created_at?: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          id?: string
          kind?: Database["public"]["Enums"]["chat_kind_enum"]
          project_id?: string
        }
        Relationships: []
      }
      episodes: {
        Row: { created_at: string; id: string; number: number | null; project_id: string; title: string | null }
        Insert: { created_at?: string; id?: string; number?: number | null; project_id: string; title?: string | null }
        Update: { created_at?: string; id?: string; number?: number | null; project_id?: string; title?: string | null }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          dept: Database["public"]["Enums"]["dept_enum"] | null
          id: string
          kind: string
          name: string
          project_id: string
          scene_id: string | null
          shift_id: string | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          id?: string
          kind?: string
          name: string
          project_id: string
          scene_id?: string | null
          shift_id?: string | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          id?: string
          kind?: string
          name?: string
          project_id?: string
          scene_id?: string | null
          shift_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          project_id: string
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          project_id: string
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          project_id?: string
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          dept: Database["public"]["Enums"]["dept_enum"] | null
          expires_at: string | null
          id: string
          is_actor: boolean
          max_uses: number | null
          project_id: string
          revoked: boolean
          role: Database["public"]["Enums"]["project_role_enum"]
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          expires_at?: string | null
          id?: string
          is_actor?: boolean
          max_uses?: number | null
          project_id: string
          revoked?: boolean
          role?: Database["public"]["Enums"]["project_role_enum"]
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          dept?: Database["public"]["Enums"]["dept_enum"] | null
          expires_at?: string | null
          id?: string
          is_actor?: boolean
          max_uses?: number | null
          project_id?: string
          revoked?: boolean
          role?: Database["public"]["Enums"]["project_role_enum"]
          used_count?: number
        }
        Relationships: []
      }
      member_departments: {
        Row: { dept: Database["public"]["Enums"]["dept_enum"]; project_id: string; user_id: string }
        Insert: { dept: Database["public"]["Enums"]["dept_enum"]; project_id: string; user_id: string }
        Update: { dept?: Database["public"]["Enums"]["dept_enum"]; project_id?: string; user_id?: string }
        Relationships: []
      }
      messages: {
        Row: {
          attachment: Json | null
          author_id: string
          body: string | null
          chat_id: string
          created_at: string
          id: string
          scene_id: string | null
          shift_id: string | null
        }
        Insert: {
          attachment?: Json | null
          author_id: string
          body?: string | null
          chat_id: string
          created_at?: string
          id?: string
          scene_id?: string | null
          shift_id?: string | null
        }
        Update: {
          attachment?: Json | null
          author_id?: string
          body?: string | null
          chat_id?: string
          created_at?: string
          id?: string
          scene_id?: string | null
          shift_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          payload: Json | null
          project_id: string
          read_at: string | null
          title: string
          urgent: boolean
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json | null
          project_id: string
          read_at?: string | null
          title: string
          urgent?: boolean
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          project_id?: string
          read_at?: string | null
          title?: string
          urgent?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; email: string | null; full_name: string | null; id: string; phone: string | null }
        Insert: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id: string; phone?: string | null }
        Update: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id?: string; phone?: string | null }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          invited_by: string | null
          is_actor: boolean
          joined_at: string
          project_id: string
          role: Database["public"]["Enums"]["project_role_enum"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_actor?: boolean
          joined_at?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role_enum"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_actor?: boolean
          joined_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role_enum"]
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: { created_at: string; created_by: string; id: string; name: string; timezone: string }
        Insert: { created_at?: string; created_by: string; id?: string; name: string; timezone?: string }
        Update: { created_at?: string; created_by?: string; id?: string; name?: string; timezone?: string }
        Relationships: []
      }
      scenes: {
        Row: {
          characters: string | null
          costume_makeup: string | null
          created_at: string
          created_by: string | null
          episode_id: string | null
          id: string
          int_ext: string | null
          location: string | null
          mode: string | null
          number: string
          project_id: string
          props: string | null
          shift_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["scene_status_enum"]
          story_day: string | null
          stunts: string | null
          sub_location: string | null
          synopsis: string | null
          updated_at: string
        }
        Insert: {
          characters?: string | null
          costume_makeup?: string | null
          created_at?: string
          created_by?: string | null
          episode_id?: string | null
          id?: string
          int_ext?: string | null
          location?: string | null
          mode?: string | null
          number: string
          project_id: string
          props?: string | null
          shift_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["scene_status_enum"]
          story_day?: string | null
          stunts?: string | null
          sub_location?: string | null
          synopsis?: string | null
          updated_at?: string
        }
        Update: {
          characters?: string | null
          costume_makeup?: string | null
          created_at?: string
          created_by?: string | null
          episode_id?: string | null
          id?: string
          int_ext?: string | null
          location?: string | null
          mode?: string | null
          number?: string
          project_id?: string
          props?: string | null
          shift_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["scene_status_enum"]
          story_day?: string | null
          stunts?: string | null
          sub_location?: string | null
          synopsis?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shift_acks: {
        Row: { acknowledged_at: string; shift_id: string; user_id: string }
        Insert: { acknowledged_at?: string; shift_id: string; user_id: string }
        Update: { acknowledged_at?: string; shift_id?: string; user_id?: string }
        Relationships: []
      }
      shift_timing: {
        Row: {
          created_at: string
          fact_end: string | null
          fact_start: string | null
          id: string
          label: string
          plan_duration_min: number | null
          plan_start: string | null
          scene_id: string | null
          shift_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fact_end?: string | null
          fact_start?: string | null
          id?: string
          label: string
          plan_duration_min?: number | null
          plan_start?: string | null
          scene_id?: string | null
          shift_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fact_end?: string | null
          fact_start?: string | null
          id?: string
          label?: string
          plan_duration_min?: number | null
          plan_start?: string | null
          scene_id?: string | null
          shift_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          address: string | null
          call_time: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          location: string | null
          note: string | null
          number: number | null
          project_id: string
          published: boolean
          updated_at: string
          wrap_time: string | null
        }
        Insert: {
          address?: string | null
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          location?: string | null
          note?: string | null
          number?: number | null
          project_id: string
          published?: boolean
          updated_at?: string
          wrap_time?: string | null
        }
        Update: {
          address?: string | null
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          location?: string | null
          note?: string | null
          number?: number | null
          project_id?: string
          published?: boolean
          updated_at?: string
          wrap_time?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      accept_invite: { Args: { p_code: string }; Returns: string }
      create_project: {
        Args: { p_dept?: Database["public"]["Enums"]["dept_enum"]; p_name: string; p_timezone?: string }
        Returns: { created_at: string; created_by: string; id: string; name: string; timezone: string }
      }
      is_project_admin: { Args: { p_project_id: string }; Returns: boolean }
      is_project_member: { Args: { p_project_id: string }; Returns: boolean }
      my_departments: { Args: { p_project_id: string }; Returns: Database["public"]["Enums"]["dept_enum"][] }
      notify_call_sheet: { Args: { p_shift_id: string }; Returns: undefined }
      open_direct_chat: { Args: { p_other_user: string; p_project_id: string }; Returns: string }
      revert_history: { Args: { p_history_id: string }; Returns: undefined }
      set_scene_status: {
        Args: { p_scene_id: string; p_status: Database["public"]["Enums"]["scene_status_enum"] }
        Returns: Database["public"]["Tables"]["scenes"]["Row"]
      }
    }
    Enums: {
      chat_kind_enum: "general" | "dept" | "direct"
      dept_enum: "dir" | "rezh" | "oper" | "svet" | "zvuk" | "hud" | "rekv" | "kost" | "grim" | "cast" | "trans" | "other"
      project_role_enum: "admin" | "member"
      scene_status_enum: "planned" | "shot" | "partial" | "moved" | "cut"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
