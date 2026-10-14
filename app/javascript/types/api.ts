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
export type ScriptType = "screenplay" | "av_script" | "treatment" | "outline" | "other";

export const SCRIPT_TYPE_LABELS: Record<ScriptType, string> = {
  screenplay: "Screenplay",
  av_script: "AV script",
  treatment: "Treatment",
  outline: "Outline",
  other: "Other",
};

export const scriptTypeLabel = (type: string | undefined): string =>
  (type && (SCRIPT_TYPE_LABELS as Record<string, string>)[type]) || type || "";

/** One row of a two-column (audio/video) script. */
export interface AvRow {
  id: number;
  script_version_id: number;
  position: number;
  shot: string | null;
  video: string;
  audio: string;
  super_text: string | null;
  duration_seconds: number | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = "pending" | "approved" | "changes_requested";

/** A no-login client review link for one round of a script. */
export interface ReviewLink {
  id: number;
  script_version_id: number;
  token: string;
  url: string;
  client_name: string | null;
  status: ReviewStatus;
  expires_at: string | null;
  revoked_at: string | null;
  decided_at: string | null;
  decided_by_name: string | null;
  decision_note: string | null;
  created_at: string;
  comment_count: number;
  open_comment_count: number;
}

export interface ReviewComment {
  id: number;
  review_link_id: number;
  av_row_id: number | null;
  scene_id: number | null;
  author_name: string;
  body: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Script {
  id: number;
  project_id: number;
  title: string;
  script_type: ScriptType;
  status: "draft" | "active" | "locked" | "archived";
  description?: string;
  created_by_user_id: string;
  author_name?: string;
  project_title?: string;
  project_type?: string;
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
  scene_numbers_locked_at?: string | null;
  revision_color?: string | null;
  revision_date?: string | null;
  revision_color_label?: string | null;
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
  scene_label?: string;                // Production label: locked number, 12A, or OMITTED
  omitted?: boolean;
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
  scene_label?: string;                // Locked production number (set by the server)
  omitted?: boolean;
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
