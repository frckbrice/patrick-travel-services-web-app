// Audit/Activity Log Types

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'CLIENT' | 'AGENT' | 'ADMIN';
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ActivityLogsFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogExportParams {
  action?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
