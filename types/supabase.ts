// types/supabase.ts - Supabase Database Types
// Generated from database schema for type safety

/**
 * Database type definitions for Supabase client
 * Used primarily in test fixtures and database operations
 */
export interface Database {
  public: {
    Tables: {
      evolution_reports: {
        Row: {
          id: string;
          user_id: string;
          dream_id: string | null;
          report_category: 'dream-specific' | 'cross-dream';
          report_type: 'essential' | 'premium';
          analysis: string;
          reflections_analyzed: string[];
          reflection_count: number;
          time_period_start: string;
          time_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['evolution_reports']['Row']>;
        Update: Partial<Database['public']['Tables']['evolution_reports']['Row']>;
      };
    };
  };
}

/**
 * Helper type for extracting table Row types
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type for extracting table Insert types
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type for extracting table Update types
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
