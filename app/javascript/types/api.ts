// API Response Types
// Re-export auto-generated types from OpenAPI spec
export type { User, status } from "./generated/types.gen";
import type { Project as GeneratedProject } from "./generated/types.gen";

// Extended Project type with all fields
export interface Project extends Omit<GeneratedProject, "name"> {
  title?: string;
  project_type?: "film" | "series" | "short" | "ad" | "documentary" | "other";
  name?: string;
}

// Additional utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Script types
export interface Script {
  id: number;
  project_id: number;
  title: string;
  script_type: "screenplay" | "treatment" | "outline" | "other";
  status: "draft" | "active" | "locked" | "archived";
  description?: string;
  created_by_user_id: string;
  author_name?: string;
  version_count: number;
  latest_version_number: number;
  created_at: string;
  updated_at: string;
  script_versions?: ScriptVersion[];
}

export interface ScriptVersion {
  id: number;
  script_id: number;
  version_number: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  has_uploaded_file?: boolean;
}

// Screenplay Element Types (industry standard formatting)
export type ScreenplayElementType =
  | "slugline"      // Scene heading: INT. LOCATION - DAY
  | "action"        // Action/description
  | "character"     // Character name before dialogue
  | "dialogue"      // Spoken lines
  | "parenthetical" // Acting direction within dialogue
  | "transition"    // CUT TO:, FADE OUT., etc.
  | "centered"      // Centered text (THE END)
  | "page_break";   // Page break marker

// Character extensions for dialogue
export type CharacterExtension = "V.O." | "O.S." | "O.C." | "CONT'D" | "PRELAP";

// Individual screenplay element
export interface ScreenplayElement {
  type: ScreenplayElementType;
  text: string;
  extensions?: CharacterExtension[];  // For character elements
  id?: string;                         // Optional client-side ID for React keys
}

export interface Scene {
  id: number;
  script_version_id: number;
  scene_number: number;
  slugline?: string;
  content?: string;
  elements?: ScreenplayElement[];      // Structured screenplay elements
  order: number;
  metadata?: SceneMetadata;
  character_names?: string[];          // Derived: characters in this scene
  locations?: string[];                // Derived: locations in this scene
  created_at: string;
  updated_at: string;
}

// Scene metadata for additional properties
export interface SceneMetadata {
  locked?: boolean;
  color?: string;                      // For revision colors (blue, pink, yellow, etc.)
  notes?: string;
  summary?: string;
  tone?: string;
  purpose?: string;
  duration?: string;
  act?: string;
  location?: string;
  status?: string;
  beats?: string[];
  breakdown?: Record<string, string[]>; // Production breakdown tags per category
  source_scene_id?: number;            // Scene this one was cloned from (previous draft)
  card_x?: number;                     // Corkboard x position
  card_y?: number;                     // Corkboard y position
  [key: string]: unknown;
}

// Add more custom types here as needed
export interface Setting {
  id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}
