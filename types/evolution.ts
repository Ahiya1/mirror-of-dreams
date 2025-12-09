// types/evolution.ts - Evolution report types

export type EvolutionReportType = 'deep-pattern' | 'growth-journey';

/**
 * Evolution report object
 */
export interface EvolutionReport {
  id: string;
  userId: string;
  reportType: EvolutionReportType;
  analysisContent: string;
  patternsIdentified: string[];
  reflectionsAnalyzed: number;
  reflectionIds: string[];
  tier: string;
  wordCount: number;
  estimatedReadTime: number;
  createdAt: string;
}

/**
 * Database row type (matches Supabase schema)
 */
export interface EvolutionReportRow {
  id: string;
  user_id: string;
  report_type: string;
  analysis_content: string;
  patterns_identified: string[];
  reflections_analyzed: number;
  reflection_ids: string[];
  tier: string;
  word_count: number;
  estimated_read_time: number;
  created_at: string;
}

/**
 * Transform database row to EvolutionReport type
 */
export function evolutionReportRowToEvolutionReport(row: EvolutionReportRow): EvolutionReport {
  return {
    id: row.id,
    userId: row.user_id,
    reportType: row.report_type as EvolutionReportType,
    analysisContent: row.analysis_content,
    patternsIdentified: row.patterns_identified,
    reflectionsAnalyzed: row.reflections_analyzed,
    reflectionIds: row.reflection_ids,
    tier: row.tier,
    wordCount: row.word_count,
    estimatedReadTime: row.estimated_read_time,
    createdAt: row.created_at,
  };
}

/**
 * Evolution progress tracking
 */
export interface EvolutionProgress {
  canGenerateNext: boolean;
  needed: number;
  total: number;
  percentage: number;
}

/**
 * Evolution report generation input
 */
export interface EvolutionReportInput {
  reportType?: EvolutionReportType;
}
