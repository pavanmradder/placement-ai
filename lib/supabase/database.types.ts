export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          college: string | null;
          target_role: string | null;
          graduation_year: number | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          college?: string | null;
          target_role?: string | null;
          graduation_year?: number | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          college?: string | null;
          target_role?: string | null;
          graduation_year?: number | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          skill_name: string;
          skill_level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_name: string;
          skill_level?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_name?: string;
          skill_level?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      dsa_progress: {
        Row: {
          id: string;
          user_id: string;
          easy_solved: number;
          medium_solved: number;
          hard_solved: number;
          total_solved: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          easy_solved?: number;
          medium_solved?: number;
          hard_solved?: number;
          total_solved?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          easy_solved?: number;
          medium_solved?: number;
          hard_solved?: number;
          total_solved?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dsa_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      mock_interviews: {
        Row: {
          id: string;
          user_id: string;
          interview_type: string;
          score: number | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interview_type: string;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interview_type?: string;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mock_interviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          ats_score: number | null;
          analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          ats_score?: number | null;
          analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          ats_score?: number | null;
          analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
