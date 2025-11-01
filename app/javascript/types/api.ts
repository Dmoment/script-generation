// API Response Types
// Re-export auto-generated types from OpenAPI spec
export type { User, Project, status } from './generated/types.gen';

// Additional utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Add more custom types here as needed
export interface Setting {
  id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

