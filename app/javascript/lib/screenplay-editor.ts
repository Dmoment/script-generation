/**
 * Helpers for the block-based screenplay editor.
 *
 * The editor keeps a list of ScreenplayElement blocks in memory and saves the
 * whole list as `elements`; the server derives the plain-text `content` and
 * the scene's slugline from it.
 */

import type { Scene, ScreenplayElement, ScreenplayElementType } from "../types/api";
import { detectElementType, softFormat } from "./screenplay-formatter";

/** Order used by Tab / Shift+Tab to cycle an element's type. */
export const TYPE_CYCLE: ScreenplayElementType[] = [
  "slugline",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "centered",
];

export const TYPE_LABELS: Record<ScreenplayElementType, string> = {
  slugline: "Scene heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  centered: "Centered",
  page_break: "Page break",
};

/** Keyboard shortcut digits (Cmd/Ctrl + N) in the same order as TYPE_CYCLE. */
export const TYPE_SHORTCUTS: Record<string, ScreenplayElementType> = {
  "1": "slugline",
  "2": "action",
  "3": "character",
  "4": "parenthetical",
  "5": "dialogue",
  "6": "transition",
  "7": "centered",
};

export const PLACEHOLDERS: Record<ScreenplayElementType, string> = {
  slugline: "INT. LOCATION - DAY",
  action: "Describe what we see.",
  character: "CHARACTER NAME",
  parenthetical: "(beat)",
  dialogue: "What they say.",
  transition: "CUT TO:",
  centered: "THE END",
  page_break: "",
};

export function cycleType(type: ScreenplayElementType, backwards = false): ScreenplayElementType {
  const index = TYPE_CYCLE.indexOf(type);
  if (index === -1) return "action";
  const next = (index + (backwards ? -1 : 1) + TYPE_CYCLE.length) % TYPE_CYCLE.length;
  return TYPE_CYCLE[next];
}

/**
 * Final Draft's Tab behaviour is contextual, which writers have in their
 * fingers: from action Tab goes straight to a character cue, from a
 * character to a parenthetical, from dialogue to a parenthetical.
 */
export function tabTarget(type: ScreenplayElementType, backwards: boolean): ScreenplayElementType {
  if (backwards) return cycleType(type, true);
  switch (type) {
    case "action":
      return "character";
    case "character":
      return "parenthetical";
    case "dialogue":
      return "parenthetical";
    case "parenthetical":
      return "dialogue";
    default:
      return cycleType(type);
  }
}

/** What a new element after Enter should be. */
export function nextTypeAfter(type: ScreenplayElementType): ScreenplayElementType {
  switch (type) {
    case "slugline":
      return "action";
    case "character":
      return "dialogue";
    case "parenthetical":
      return "dialogue";
    case "dialogue":
      return "action";
    case "transition":
      return "slugline";
    default:
      return "action";
  }
}

let idCounter = 0;
export function newElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  idCounter += 1;
  return `el-${Date.now()}-${idCounter}`;
}

export function makeElement(type: ScreenplayElementType, text = ""): ScreenplayElement {
  return { id: newElementId(), type, text };
}

export function ensureIds(elements: ScreenplayElement[]): ScreenplayElement[] {
  return elements.map((el) => (el.id ? el : { ...el, id: newElementId() }));
}

/**
 * Build the editable block list for a scene. The scene heading is always the
 * first block so the heading column and the body stay in step.
 */
export function elementsFromScene(scene: Scene): ScreenplayElement[] {
  const stored = Array.isArray(scene.elements) ? scene.elements : [];
  const hasSlugline = stored.some((el) => el.type === "slugline");
  const blocks = [...stored];

  if (!hasSlugline && scene.slugline) {
    blocks.unshift({ type: "slugline", text: scene.slugline });
  }
  // Always give the writer somewhere to type: an empty scene, or one that is
  // only a heading, gets an empty action block.
  if (blocks.length === 0 || (blocks.length === 1 && blocks[0].type === "slugline")) {
    blocks.push({ type: "action", text: "" });
  }
  // While editing, a cue's extensions are part of its text: "BABA (V.O.)".
  return ensureIds(blocks).map((el) =>
    el.type === "character" ? { ...el, text: cueText(el), extensions: undefined } : el
  );
}

/** Drop empty blocks before saving (page breaks stay) and split cue extensions out. */
export function elementsForSave(elements: ScreenplayElement[]): ScreenplayElement[] {
  return elements
    .filter((el) => el.type === "page_break" || el.text.trim().length > 0)
    .map(({ id, type, text }) => {
      // Headings, cues and transitions are always stored in their formatted
      // form, even if the writer navigated away before the block was committed.
      const stored = type === "slugline" || type === "character" || type === "transition" ? softFormat(type, text) : text;
      const out: ScreenplayElement = { type, text: stored.trim() };
      if (id) out.id = id;
      if (type === "character") {
        const cue = parseCue(text);
        out.text = cue.text;
        if (cue.extensions) out.extensions = cue.extensions;
      }
      return out;
    });
}

/**
 * Commit a block: apply the writer-expected formatting and, for untyped
 * action blocks, adopt the element type the text clearly is (a heading, a
 * transition, a parenthetical, an all-caps cue).
 */
export function commitElement(
  element: ScreenplayElement,
  previousType?: ScreenplayElementType
): ScreenplayElement {
  let type = element.type;
  const text = element.text;
  if (type === "action" && text.trim()) {
    const detected = detectElementType(text, previousType);
    if (detected !== "action" && detected !== "dialogue") type = detected;
  }
  return { ...element, type, text: softFormat(type, text) };
}

/** Characters' extensions live in the cue text while editing ("BABA (V.O.)"). */
export function cueText(element: ScreenplayElement): string {
  if (element.type !== "character" || !element.extensions?.length) return element.text;
  return `${element.text} ${element.extensions.map((e) => `(${e})`).join(" ")}`;
}

const CHARACTER_EXTENSIONS = ["V.O.", "O.S.", "O.C.", "CONT'D", "PRELAP"];

/** "baba (v.o.) (cont'd)" -> { text: "BABA", extensions: ["V.O.", "CONT'D"] } */
export function parseCue(text: string): { text: string; extensions: ScreenplayElement["extensions"] } {
  let name = text.trim().toUpperCase();
  const extensions: string[] = [];
  let match: RegExpMatchArray | null;
  while ((match = name.match(/\s*\(([^)]+)\)\s*$/)) && match.index !== undefined) {
    const ext = match[1].trim().toUpperCase();
    if (!CHARACTER_EXTENSIONS.includes(ext)) break;
    extensions.unshift(ext);
    name = name.slice(0, match.index).trim();
  }
  return { text: name, extensions: extensions.length ? (extensions as ScreenplayElement["extensions"]) : undefined };
}

/** Characters that appear across the whole version, most used first. */
export function knownCharacters(scenes: Scene[]): string[] {
  const counts = new Map<string, number>();
  scenes.forEach((scene) => {
    (scene.character_names || []).forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
    (scene.elements || []).forEach((el) => {
      if (el.type === "character" && el.text) counts.set(el.text, (counts.get(el.text) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

export function knownSluglines(scenes: Scene[]): string[] {
  const seen = new Set<string>();
  scenes.forEach((scene) => {
    if (scene.slugline) seen.add(scene.slugline);
    (scene.elements || []).forEach((el) => {
      if (el.type === "slugline" && el.text) seen.add(el.text);
    });
  });
  return [...seen];
}

/** Characters per line on a standard 8.5x11 screenplay page, by element. */
const LINE_WIDTH: Record<ScreenplayElementType, number> = {
  slugline: 60,
  action: 60,
  character: 38,
  parenthetical: 25,
  dialogue: 35,
  transition: 60,
  centered: 60,
  page_break: 60,
};

const LINES_PER_PAGE = 55;

/** Rough page length (1 page ≈ 1 minute of screen time). */
export function estimatePages(elements: ScreenplayElement[]): number {
  let lines = 0;
  let previous: ScreenplayElementType | null = null;
  elements.forEach((el) => {
    if (el.type === "page_break") {
      lines = Math.ceil(lines / LINES_PER_PAGE) * LINES_PER_PAGE;
      previous = el.type;
      return;
    }
    const contiguous =
      (el.type === "dialogue" || el.type === "parenthetical") &&
      (previous === "character" || previous === "parenthetical" || previous === "dialogue");
    if (!contiguous && lines > 0) lines += 1;
    const width = LINE_WIDTH[el.type] || 60;
    const text = el.text || "";
    lines += Math.max(1, text.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / width)), 0));
    previous = el.type;
  });
  return lines / LINES_PER_PAGE;
}

export function formatPages(pages: number): string {
  if (pages < 0.125) return "< ⅛ page";
  if (pages < 1) {
    const eighths = Math.round(pages * 8);
    return `${eighths}⁄8 page`;
  }
  return `${(Math.round(pages * 10) / 10).toFixed(1)} pages`;
}
