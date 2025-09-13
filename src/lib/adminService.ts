// Minimal shim for admin service
// TODO: Implement actual admin service methods

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

export const ensureLoggerType = (data: any): Logger => ({ id: String(data?.id ?? 'unknown'), name: data?.name, email: data?.email });

export const adminService = {
  authToken: null as string | null,
  setAuthToken(token: string | null) {
    this.authToken = token;
  },
  async getLoggers(): Promise<ApiResponse<Logger[]>> {
    return { success: true, data: [] };
  },
  async getStatistics(): Promise<ApiResponse<any>> {
    return { success: true, data: {} };
  },
  async createLogger(payload: any): Promise<ApiResponse> { return { success: true }; },
  async updateLogger(id: string, updates: any): Promise<ApiResponse> { return { success: true }; },
  async deleteLogger(id: string): Promise<ApiResponse> { return { success: true }; },
  async suspendLogger(id: string): Promise<ApiResponse> { return { success: true }; },
  async activateLogger(id: string): Promise<ApiResponse> { return { success: true }; },
  async getLoggerCompetitions(): Promise<ApiResponse<LoggerCompetition[]>> { return { success: true, data: [] }; },
  async getLoggerMatches(): Promise<ApiResponse<LoggerMatch[]>> { return { success: true, data: [] }; },
  async createLoggerMatch(data: any): Promise<ApiResponse> { return { success: true }; },
  async updateLoggerMatch(id: string, updates: any): Promise<ApiResponse> { return { success: true }; },
  async addLoggerEvent(matchId: string, event: any): Promise<ApiResponse> { return { success: true }; },
  async generateLoggerReport(matchId: string): Promise<ApiResponse> { return { success: true }; },
};
