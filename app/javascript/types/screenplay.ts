/**
 * Screenplay Formatting Types and Constants
 * Based on industry-standard screenplay formatting rules
 */

import type { ScreenplayElement, ScreenplayElementType, CharacterExtension } from './api';

// Re-export for convenience
export type { ScreenplayElement, ScreenplayElementType, CharacterExtension };

// Element type constants
export const ELEMENT_TYPES: ScreenplayElementType[] = [
  'slugline',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
  'centered',
  'page_break',
];

// Elements that should be uppercase
export const UPPERCASE_ELEMENTS: ScreenplayElementType[] = [
  'slugline',
  'character',
  'transition',
];

// Valid character extensions
export const CHARACTER_EXTENSIONS: CharacterExtension[] = [
  'V.O.',
  'O.S.',
  'O.C.',
  "CONT'D",
  'PRELAP',
];

// Common time of day values for sluglines
export const TIMES_OF_DAY = [
  'DAY',
  'NIGHT',
  'DAWN',
  'DUSK',
  'SUNSET',
  'SUNRISE',
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'CONTINUOUS',
  'LATER',
  'SAME',
  'MOMENTS LATER',
] as const;

// Common transitions
export const TRANSITIONS = [
  'CUT TO:',
  'FADE IN:',
  'FADE OUT.',
  'FADE TO BLACK.',
  'DISSOLVE TO:',
  'SMASH CUT TO:',
  'MATCH CUT TO:',
  'JUMP CUT TO:',
  'TIME CUT:',
  'INTERCUT:',
] as const;

// Slugline prefixes
export const SLUGLINE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'I/E.'] as const;

/**
 * Industry-standard page layout margins (in inches)
 * Used for PDF export and visual representation
 */
export const MARGINS = {
  slugline: { left: 1.5, right: 1.0 },
  action: { left: 1.5, right: 1.0 },
  character: { left: 3.7, right: 0 },      // ~3.5" centered
  dialogue: { left: 2.5, right: 2.0 },
  parenthetical: { left: 3.0, right: 2.5 },
  transition: { left: 6.0, right: 0 },     // Right-aligned
  centered: { left: 0, right: 0 },         // Centered
  page_break: { left: 0, right: 0 },
} as const;

/**
 * CSS classes for visual formatting in the editor
 * Maps element types to Tailwind classes
 */
export const ELEMENT_STYLES: Record<ScreenplayElementType, string> = {
  slugline: 'uppercase font-bold',
  action: '',
  character: 'uppercase text-center ml-[3.5in]',
  dialogue: 'ml-[2.5in] mr-[2in] max-w-[3.5in]',
  parenthetical: 'ml-[3in] mr-[2.5in] max-w-[2in] italic',
  transition: 'uppercase text-right',
  centered: 'text-center',
  page_break: 'border-t border-dashed border-gray-400 my-4',
};

/**
 * Keyboard shortcuts for element switching
 */
export const ELEMENT_SHORTCUTS: Record<string, ScreenplayElementType> = {
  's': 'slugline',
  'a': 'action',
  'c': 'character',
  'd': 'dialogue',
  'p': 'parenthetical',
  't': 'transition',
};

/**
 * Regex patterns for element detection
 */
export const PATTERNS = {
  slugline: /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+/i,
  character: /^[A-Z][A-Z\s\-'\.]+(\s*\([^)]+\))?$/,
  parenthetical: /^\([^)]+\)$/,
  transition: /^(CUT TO|FADE|DISSOLVE|SMASH CUT|MATCH CUT|JUMP CUT|TIME CUT|INTERCUT)/i,
};

/**
 * Helper function to detect element type from text
 */
export function detectElementType(
  text: string,
  previousType?: ScreenplayElementType
): ScreenplayElementType {
  const trimmed = text.trim();
  
  if (!trimmed) return 'action';

  // Check patterns
  if (PATTERNS.slugline.test(trimmed)) return 'slugline';
  if (PATTERNS.transition.test(trimmed)) return 'transition';
  if (PATTERNS.parenthetical.test(trimmed)) return 'parenthetical';
  
  // Character detection (must be uppercase, short, and not after another character)
  if (
    previousType !== 'character' &&
    PATTERNS.character.test(trimmed) &&
    trimmed.length < 50 &&
    trimmed === trimmed.toUpperCase()
  ) {
    return 'character';
  }

  // After character or parenthetical, assume dialogue
  if (previousType === 'character' || previousType === 'parenthetical') {
    return 'dialogue';
  }

  // Default to action
  return 'action';
}

/**
 * Helper to format text according to element type
 */
export function formatElementText(
  type: ScreenplayElementType,
  text: string
): string {
  const trimmed = text.trim();

  switch (type) {
    case 'slugline':
    case 'character':
    case 'transition':
      return trimmed.toUpperCase();
    case 'parenthetical':
      // Ensure wrapped in parentheses
      if (!trimmed.startsWith('(')) return `(${trimmed})`;
      if (!trimmed.endsWith(')')) return `${trimmed})`;
      return trimmed.toLowerCase();
    default:
      return trimmed;
  }
}

/**
 * Create a new element with defaults
 */
export function createElement(
  type: ScreenplayElementType,
  text: string = '',
  extensions?: CharacterExtension[]
): ScreenplayElement {
  const element: ScreenplayElement = {
    type,
    text: formatElementText(type, text),
    id: crypto.randomUUID(),
  };

  if (type === 'character' && extensions?.length) {
    element.extensions = extensions;
  }

  return element;
}

/**
 * Get the next logical element type after pressing Enter
 */
export function getNextElementType(
  currentType: ScreenplayElementType
): ScreenplayElementType {
  switch (currentType) {
    case 'slugline':
      return 'action';
    case 'action':
      return 'action';
    case 'character':
      return 'dialogue';
    case 'dialogue':
      return 'character';
    case 'parenthetical':
      return 'dialogue';
    case 'transition':
      return 'slugline';
    default:
      return 'action';
  }
}

/**
 * Check if element type should be uppercase
 */
export function shouldBeUppercase(type: ScreenplayElementType): boolean {
  return UPPERCASE_ELEMENTS.includes(type);
}

