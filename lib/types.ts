export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      websites: {
        Row: {
          id: string
          url: string
          status: 'pending' | 'scraping' | 'completed' | 'failed'
          created_at: string
          completed_at: string | null
          total_assets: number
          notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          url: string
          status?: 'pending' | 'scraping' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string | null
          total_assets?: number
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          url?: string
          status?: 'pending' | 'scraping' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string | null
          total_assets?: number
          notes?: string | null
          user_id?: string | null
        }
      }
      assets: {
        Row: {
          id: string
          website_id: string
          file_type: string
          url: string
          local_path: string | null
          size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          file_type: string
          url: string
          local_path?: string | null
          size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          file_type?: string
          url?: string
          local_path?: string | null
          size_bytes?: number | null
          created_at?: string
        }
      }
      metadata: {
        Row: {
          id: string
          website_id: string
          title: string | null
          description: string | null
          keywords: string | null
          favicon: string | null
          color_palette: Json | null
          fonts: Json | null
          technologies: Json | null
          images: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          title?: string | null
          description?: string | null
          keywords?: string | null
          favicon?: string | null
          color_palette?: Json | null
          fonts?: Json | null
          technologies?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          title?: string | null
          description?: string | null
          keywords?: string | null
          favicon?: string | null
          color_palette?: Json | null
          fonts?: Json | null
          technologies?: Json | null
          created_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          website_id: string
          message: string
          type: 'info' | 'error' | 'success' | 'warning'
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          message: string
          type?: 'info' | 'error' | 'success' | 'warning'
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          message?: string
          type?: 'info' | 'error' | 'success' | 'warning'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          updated_at?: string
        }
      }
    }
  }
}
