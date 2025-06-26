// Formato consolidado y limpio
export interface ConsolidatedSummaries {
  claim_acknowledgment: string;
  coverage_determination: string;
  demand_letter: string;
}

export interface ProcessingStats {
  files_processed: number;
  total_time_ms: number;
  average_time_per_file: number;
  successful_extractions: number;
  failed_extractions: number;
}

export interface ProcessClaimsResponse {
  success: boolean;
  timestamp: string;
  summaries: ConsolidatedSummaries;
  processing_stats: ProcessingStats;
  errors?: string[];
}

// Mantener interfaces legacy para compatibilidad
export interface ProcessClaimsData {
  claim_ack_letter_summary: string;
  cov_det_summary: string;
  demand_letter_summary: string;
}

export interface ProcessClaimsMetadata {
  processed_files: number;
  total_expected: number;
  processing_time_ms: number;
  errors?: string[];
}

export interface HealthCheckResponse {
  status: string;
  db: string;
  timestamp: string;
}

export interface ClaimsConfigResponse {
  expected_files: string[];
  fields: string[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
} 