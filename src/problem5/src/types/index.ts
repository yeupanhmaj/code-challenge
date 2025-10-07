// Type definitions for the application
export interface User {
  id?: number;
  name: string;
  email: string;
  age?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  age?: number;
}

export interface QueryFilters {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  minAge?: number;
  maxAge?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface DatabaseConfig {
  path: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  apiPrefix: string;
  maxItemsPerPage: number;
  corsOrigin: string;
}