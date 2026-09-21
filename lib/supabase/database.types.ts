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
          target_role: string | null;
          difficulty: string | null;
          status: string;
          questions: Json | null;
          current_question_index: number;
          score: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interview_type: string;
          target_role?: string | null;
          difficulty?: string | null;
          status?: string;
          questions?: Json | null;
          current_question_index?: number;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interview_type?: string;
          target_role?: string | null;
          difficulty?: string | null;
          status?: string;
          questions?: Json | null;
          current_question_index?: number;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
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
          file_path: string | null;
          storage_path: string | null;
          file_size: number | null;
          mime_type: string | null;
          ats_score: number | null;
          analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path?: string | null;
          storage_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          ats_score?: number | null;
          analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string | null;
          storage_path?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
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
      skill_gap_analyses: {
        Row: {
          id: string;
          user_id: string;
          target_role: string;
          current_skills: Json;
          required_skills: Json;
          missing_skills: Json;
          skill_match_percentage: number;
          recommendations: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_role: string;
          current_skills?: Json;
          required_skills?: Json;
          missing_skills?: Json;
          skill_match_percentage?: number;
          recommendations?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_role?: string;
          current_skills?: Json;
          required_skills?: Json;
          missing_skills?: Json;
          skill_match_percentage?: number;
          recommendations?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_gap_analyses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      dsa_problems: {
        Row: {
          id: string;
          title: string;
          slug: string;
          topic: string;
          difficulty: "Easy" | "Medium" | "Hard" | string;
          platform: string;
          external_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          topic: string;
          difficulty: "Easy" | "Medium" | "Hard" | string;
          platform?: string;
          external_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          topic?: string;
          difficulty?: "Easy" | "Medium" | "Hard" | string;
          platform?: string;
          external_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_dsa_progress: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          status: "not_started" | "in_progress" | "solved" | string;
          solved_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          status?: "not_started" | "in_progress" | "solved" | string;
          solved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          status?: "not_started" | "in_progress" | "solved" | string;
          solved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_dsa_progress_problem_id_fkey";
            columns: ["problem_id"];
            isOneToOne: false;
            referencedRelation: "dsa_problems";
            referencedSchema: "public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_dsa_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          job_title: string;
          application_date: string;
          status: "applied" | "oa" | "interview" | "offer" | "rejected" | string;
          job_url: string | null;
          location: string | null;
          package_ctc: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          job_title: string;
          application_date?: string;
          status?: "applied" | "oa" | "interview" | "offer" | "rejected" | string;
          job_url?: string | null;
          location?: string | null;
          package_ctc?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          job_title?: string;
          application_date?: string;
          status?: "applied" | "oa" | "interview" | "offer" | "rejected" | string;
          job_url?: string | null;
          location?: string | null;
          package_ctc?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          },
        ];
      };
      placement_roadmaps: {
        Row: {
          id: string;
          user_id: string;
          target_role: string;
          title: string;
          description: string | null;
          duration_weeks: number;
          roadmap_data: Json;
          overall_progress: number;
          status: "active" | "completed" | "archived" | string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_role: string;
          title: string;
          description?: string | null;
          duration_weeks?: number;
          roadmap_data?: Json;
          overall_progress?: number;
          status?: "active" | "completed" | "archived" | string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_role?: string;
          title?: string;
          description?: string | null;
          duration_weeks?: number;
          roadmap_data?: Json;
          overall_progress?: number;
          status?: "active" | "completed" | "archived" | string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "placement_roadmaps_user_id_fkey";
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
