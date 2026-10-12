/**
 * Soft Screenplay Formatter
 * 
 * Real-time formatting assistance that feels like typing help, not enforcement.
 * 
 * Philosophy:
 * - INVISIBLE: Writer never sees "rules"
 * - EXPECTED: Only do what Final Draft/WriterDuet do
 * - SAFE: Never changes creative intent
 * - NO ERRORS: Never block, warn, or popup
 */

import type { ScreenplayElement, ScreenplayElementType } from '../types/api';

// ============================================================================
// ELEMENT TYPE DETECTION
// ============================================================================

/**
 * Detect element type from text and context
 * Returns best guess - writer can always override
 */
export function detectElementType(
  text: string,
  previousType?: ScreenplayElementType
): ScreenplayElementType {
  const trimmed = text.trim();
  
  if (!trimmed) return 'action';

  // 1. Slugline: starts with INT./EXT.
  if (/^(int\.?|ext\.?|int\.?\/ext\.?|i\/e\.?)\s+/i.test(trimmed)) {
    return 'slugline';
  }

  // 2. Transition: CUT TO, FADE, etc.
  if (/^(cut to|fade|dissolve|smash cut|match cut|jump cut|intercut)/i.test(trimmed)) {
    return 'transition';
  }

  // 3. Parenthetical: wrapped in parens
  if (/^\([^)]+\)$/.test(trimmed)) {
    return 'parenthetical';
  }

  // 4. After character → dialogue
  if (previousType === 'character') {
    return 'dialogue';
  }

  // 5. After parenthetical → dialogue (continuing)
  if (previousType === 'parenthetical') {
    return 'dialogue';
  }

  // 6. Character: ALL CAPS, short, looks like a name
  if (looksLikeCharacter(trimmed, previousType)) {
    return 'character';
  }

  // Default: action
  return 'action';
}

/**
 * Check if text looks like a character name
 */
function looksLikeCharacter(text: string, previousType?: ScreenplayElementType): boolean {
  if (previousType === 'character') return false;  // Can't have two in a row
  if (text.length > 40) return false;               // Too long
  if (text.includes('.')) return false;             // Likely a sentence
  if (text.split(' ').length > 4) return false;     // Too many words
  
  // Must be uppercase and at least 2 chars
  return text === text.toUpperCase() && text.length >= 2;
}

// ============================================================================
// SOFT FORMATTING (Real-time, invisible)
// ============================================================================

/**
 * Apply soft formatting to text based on element type
 * These transforms are EXPECTED by writers - they feel like autocomplete
 */
export function softFormat(type: ScreenplayElementType, text: string): string {
  if (!text) return '';
  
  switch (type) {
    case 'slugline':
      return softFormatSlugline(text);
    case 'character':
      return softFormatCharacter(text);
    case 'transition':
      return softFormatTransition(text);
    case 'parenthetical':
      return softFormatParenthetical(text);
    default:
      // dialogue, action - preserve as-is
      return text;
  }
}

/**
 * Slugline: uppercase + punctuation
 * "int beach day" → "INT. BEACH - DAY"
 */
function softFormatSlugline(text: string): string {
  let result = text.trim().toUpperCase();
  
  // Normalize INT/EXT prefix
  result = result
    .replace(/^INT\s*\/\s*EXT\s*\.?\s*/i, 'INT./EXT. ')
    .replace(/^I\s*\/\s*E\s*\.?\s*/i, 'INT./EXT. ')
    .replace(/^INT\s*\.?\s*(?!\/)/i, 'INT. ')
    .replace(/^EXT\s*\.?\s*/i, 'EXT. ');
  
  // Normalize dashes (only if there's already a separator)
  if (/\s[-–—]\s/.test(result)) {
    result = result.replace(/\s*[-–—]\s*/g, ' - ');
  }
  
  return result;
}

/**
 * Character: just uppercase
 * "barry" → "BARRY"
 */
function softFormatCharacter(text: string): string {
  return text.trim().toUpperCase();
}

/**
 * Transition: uppercase + colon
 * "cut to" → "CUT TO:"
 */
function softFormatTransition(text: string): string {
  let result = text.trim().toUpperCase();
  if (!result.endsWith(':') && !result.endsWith('.')) {
    result += ':';
  }
  return result;
}

/**
 * Parenthetical: lowercase + parens
 * "beat" → "(beat)"
 */
function softFormatParenthetical(text: string): string {
  let result = text.trim().toLowerCase();
  if (!result.startsWith('(')) result = '(' + result;
  if (!result.endsWith(')')) result = result + ')';
  return result;
}

// ============================================================================
// ELEMENT FLOW (What happens on Enter)
// ============================================================================

/**
 * Get the next element type after pressing Enter
 */
export function getNextElementType(currentType: ScreenplayElementType): ScreenplayElementType {
  switch (currentType) {
    case 'slugline':
      return 'action';     // After scene heading → describe the scene
    case 'action':
      return 'action';     // Keep as action, detection will find character
    case 'character':
      return 'dialogue';   // After character → they speak
    case 'dialogue':
      return 'action';     // After dialogue → back to action/next character
    case 'parenthetical':
      return 'dialogue';   // After parenthetical → continue dialogue
    case 'transition':
      return 'slugline';   // After transition → new scene
    default:
      return 'action';
  }
}

// ============================================================================
// HELPER: Create new element
// ============================================================================

/**
 * Create a new screenplay element with soft formatting applied
 */
export function createElement(
  type: ScreenplayElementType,
  text: string = ''
): ScreenplayElement {
  return {
    type,
    text: softFormat(type, text),
    id: crypto.randomUUID(),
  };
}

/**
 * Create an empty element for the next line
 */
export function createNextElement(currentType: ScreenplayElementType): ScreenplayElement {
  const nextType = getNextElementType(currentType);
  return createElement(nextType, '');
}

// ============================================================================
// CSS STYLING (for visual formatting in editor)
// ============================================================================

/**
 * Get CSS classes for element type
 * These handle the visual margins/centering without writer thinking about it
 */
export const ELEMENT_CLASSES: Record<ScreenplayElementType, string> = {
  slugline: 'uppercase font-bold',
  action: '',
  character: 'uppercase text-center',
  dialogue: 'mx-auto max-w-[35ch]',  // ~3.5 inches at 10 chars/inch
  parenthetical: 'mx-auto max-w-[25ch] italic text-center',
  transition: 'uppercase text-right',
  centered: 'text-center',
  page_break: 'border-t border-dashed border-gray-300 my-8',
};

/**
 * Get inline styles for element type (for more precise control)
 */
export function getElementStyle(type: ScreenplayElementType): React.CSSProperties {
  switch (type) {
    case 'character':
      return { marginLeft: '40%' };  // Approximate 3.5" indent
    case 'dialogue':
      return { marginLeft: '15%', marginRight: '20%' };
    case 'parenthetical':
      return { marginLeft: '25%', marginRight: '30%' };
    case 'transition':
      return { textAlign: 'right', marginRight: '10%' };
    default:
      return {};
  }
}

