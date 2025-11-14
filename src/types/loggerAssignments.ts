// Logger Assignment Types and Interfaces

export type LoggerAssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface LoggerAssignment {
  id: string;
  logger_id: string;
  competition_id?: number | null;
  match_id?: number | null;
  assigned_at: string;
  assigned_by?: string | null;
  status: LoggerAssignmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLoggerAssignmentPayload {
  logger_id: string;
  competition_id?: number | null;
  match_id?: number | null;
  assigned_by?: string;
  notes?: string;
  status?: LoggerAssignmentStatus;
}

export interface UpdateLoggerAssignmentPayload {
  status?: LoggerAssignmentStatus;
  notes?: string;
}

export interface LoggerAssignmentWithDetails extends LoggerAssignment {
  logger?: {
    id: string;
    name: string;
    email: string;
  };
  competition?: {
    id: number;
    name: string;
    type: string;
  };
  match?: {
    id: number;
    home_team_id: number;
    away_team_id: number;
    match_date: string;
    status: string;
  };
}

export interface AssignLoggerPayload {
  loggerId: string;
  competitionId?: number;
  matchId?: number;
  notes?: string;
}

export interface LoggerAssignmentFilters {
  logger_id?: string;
  competition_id?: number;
  match_id?: number;
  status?: LoggerAssignmentStatus;
  assigned_by?: string;
  from_date?: string;
  to_date?: string;
}

export interface LoggerAssignmentResponse {
  success: boolean;
  data?: LoggerAssignment | LoggerAssignmentWithDetails;
  error?: {
    message: string;
    code?: string;
  };
}

export interface LoggerAssignmentsListResponse {
  success: boolean;
  data?: LoggerAssignment[] | LoggerAssignmentWithDetails[];
  count?: number;
  error?: {
    message: string;
    code?: string;
  };
}

// Assignment conflict check result
export interface AssignmentConflict {
  hasConflict: boolean;
  conflictingAssignment?: LoggerAssignment;
  message?: string;
}
