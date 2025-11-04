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
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'supervisor' | 'operator'
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: 'admin' | 'supervisor' | 'operator'
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'supervisor' | 'operator'
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string
          shift_type: 'morning' | 'afternoon' | 'night'
          location: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time: string
          shift_type: 'morning' | 'afternoon' | 'night'
          location?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string
          shift_type?: 'morning' | 'afternoon' | 'night'
          location?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      shift_swaps: {
        Row: {
          id: string
          requested_by_id: string
          swap_with_id: string | null
          original_shift_id: string
          target_shift_id: string | null
          status: 'pending' | 'accepted_by_operator' | 'approved' | 'rejected' | 'cancelled'
          reason: string | null
          created_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          requested_by_id: string
          swap_with_id?: string | null
          original_shift_id: string
          target_shift_id?: string | null
          status?: 'pending' | 'accepted_by_operator' | 'approved' | 'rejected' | 'cancelled'
          reason?: string | null
          created_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          requested_by_id?: string
          swap_with_id?: string | null
          original_shift_id?: string
          target_shift_id?: string | null
          status?: 'pending' | 'accepted_by_operator' | 'approved' | 'rejected' | 'cancelled'
          reason?: string | null
          created_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      swap_messages: {
        Row: {
          id: string
          swap_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          swap_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          swap_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
