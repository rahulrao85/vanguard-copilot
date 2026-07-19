/** Type definitions for Vanguard Co-Pilot data models. */

export interface GateData {
  gate_id: string;
  sensor_count: number;
  capacity: number;
}

export interface CalculateRequest {
  stadium_id: string;
  gates: GateData[];
}

export interface GateStatus {
  gate_id: string;
  density_percent: number;
  status: 'clear' | 'moderate' | 'busy' | 'critical';
  recommendation: string;
}

export interface CalculateResponse {
  stadium_id: string;
  overall_density_percent: number;
  total_people: number;
  total_capacity: number;
  gates: GateStatus[];
  timestamp: string;
}

export interface EntryRequest {
  device_id: string;
  activity_type: 'crowd_report' | 'incident_log' | 'shift_checkin' | 'facility_issue' | 'fan_assist' | 'other';
  description: string;
  location?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface EntryResponse {
  entry_id: string;
  device_id: string;
  activity_type: string;
  description: string;
  location?: string;
  severity: string;
  created_at: string;
  status: string;
}

export interface EntriesListResponse {
  device_id: string;
  entries: EntryResponse[];
  total: number;
}

export interface InsightsRequest {
  stadium_id: string;
  context_type: 'crowd_routing' | 'fan_translation' | 'facility_alert' | 'ticketing_support';
  input_text: string;
  target_language: string;
  gate_data?: GateData[];
}

export interface InsightsResponse {
  stadium_id: string;
  context_type: string;
  megaphone_script: string;
  reasoning: string;
  target_language: string;
  recommendations: string[];
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  database: string;
  gemini_configured: boolean;
  version: string;
}

export interface ApiError {
  detail: string;
  error_code?: string;
}
