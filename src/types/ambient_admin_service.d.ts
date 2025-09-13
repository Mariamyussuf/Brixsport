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
  };

  export type LoggerMatch = any;
  export type LoggerCompetition = any;

  export type ApiResponse<T = any> = { success: boolean; data?: T; error?: { message?: string; code?: number } };

  export const ensureLoggerType: (data: any) => Logger;
  export const adminService: {
    authToken: string | null;
    setAuthToken: (token: string | null) => void;
    getLoggers: () => Promise<ApiResponse<Logger[]>>;
    getStatistics: () => Promise<ApiResponse<any>>;
    createLogger: (payload: any) => Promise<ApiResponse>;
    updateLogger: (id: string, updates: any) => Promise<ApiResponse>;
    deleteLogger: (id: string) => Promise<ApiResponse>;
    suspendLogger: (id: string) => Promise<ApiResponse>;
    activateLogger: (id: string) => Promise<ApiResponse>;
    getLoggerCompetitions: () => Promise<ApiResponse<LoggerCompetition[]>>;
    getLoggerMatches: () => Promise<ApiResponse<LoggerMatch[]>>;
    createLoggerMatch: (data: any) => Promise<ApiResponse>;
    updateLoggerMatch: (id: string, updates: any) => Promise<ApiResponse>;
    addLoggerEvent: (matchId: string, event: any) => Promise<ApiResponse>;
    generateLoggerReport: (matchId: string) => Promise<ApiResponse>;
  };

  export {};
}
