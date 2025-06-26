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

export interface ProcessClaimsResponse {
  success: boolean;
  data: ProcessClaimsData;
  metadata: ProcessClaimsMetadata;
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