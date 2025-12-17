// API Response Types
// Re-export auto-generated types from OpenAPI spec
export type { User, status } from './generated/types.gen';
import type { Project as GeneratedProject } from './generated/types.gen';

// Extended Project type with all fields
export interface Project extends Omit<GeneratedProject, 'name'> {
  title?: string;
  project_type?: 'film' | 'series' | 'short' | 'ad' | 'documentary' | 'other';
  name?: string;
}

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

