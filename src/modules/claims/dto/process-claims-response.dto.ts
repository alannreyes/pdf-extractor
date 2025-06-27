// ✅ RESPUESTA INDIVIDUAL SIMPLIFICADA
export interface ProcessSingleFileResponse {
  success: boolean;
  timestamp: string;
  filename: string;
  fieldname: string;
  summary: string;
  processing_time_ms: number;
  error?: string;
}

// ✅ RESPUESTA DE ERROR SIMPLE
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  timestamp: string;
}

// ✅ RESPUESTAS DE UTILIDAD
export interface HealthCheckResponse {
  status: string;
  db: string;
  timestamp: string;
}

export interface ClaimsConfigResponse {
  expected_files: string[];
  fields: string[];
} 