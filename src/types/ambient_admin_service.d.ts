declare module '@/lib/adminService' {
  export type Logger = {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    status?: 'active' | 'suspended' | string;
    createdAt?: string;
    lastActive?: string;
    assignedCompetitions?: string[];
    password?: string; // Added for credential management
  };

  export type LoggerMatch = {
    id: string;
    competitionId: string;
    homeTeamId: string;
    awayTeamId: string;
    startTime: string;
    status: string;
    homeScore?: number;
    awayScore?: number;
    period?: string;
    timeRemaining?: string;
    events: any[];
    loggerId: string;
    lastUpdated: string;
  };

  export type LoggerCompetition = any;

  export type ApiResponse<T = any> = { success: boolean; data?: T; error?: { message?: string; code?: number } };

  export const ensureLoggerType: (data: any) => Logger;
  export const adminService: {
    createLoggerWithCredentials(loggerData: Omit<Logger, "id" | "createdAt" | "lastActive"> & { password: string; }): Promise<ApiResponse<Logger>>;
    assignLoggerToMatch(matchId: string, loggerId: string): Promise<ApiResponse<LoggerMatch>>;
    authToken: string | null;
    setAuthToken: (token: string | null) => void;
    getLoggers: () => Promise<ApiResponse<Logger[]>>;
    getStatistics: () => Promise<ApiResponse<any>>;
    createLogger: (payload: any) => Promise<ApiResponse<Logger>>;
    updateLogger: (id: string, updates: any) => Promise<ApiResponse<Logger>>;
    deleteLogger: (id: string) => Promise<ApiResponse<boolean>>;
    suspendLogger: (id: string) => Promise<ApiResponse<Logger>>;
    activateLogger: (id: string) => Promise<ApiResponse<Logger>>;
    getLoggerCompetitions: () => Promise<ApiResponse<LoggerCompetition[]>>;
    getLoggerMatches: () => Promise<ApiResponse<LoggerMatch[]>>;
    createLoggerMatch: (data: any) => Promise<ApiResponse<LoggerMatch>>;
    updateLoggerMatch: (id: string, updates: any) => Promise<ApiResponse<LoggerMatch>>;
    addLoggerEvent: (matchId: string, event: any) => Promise<ApiResponse<LoggerMatch>>;
    generateLoggerReport: (matchId: string) => Promise<ApiResponse<any>>;
  };

  export {};
}