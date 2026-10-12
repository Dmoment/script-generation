import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useUpdateSceneMutation } from "../../queries/scenes/useUpdateSceneMutation";
import type { Scene, ScreenplayElement, ScreenplayElementType } from "../../types/api";
import { colors } from "../../lib/theme";
import { detectElementType, softFormat } from "../../lib/screenplay-formatter";
import {
  TYPE_CYCLE,
  TYPE_LABELS,
  TYPE_SHORTCUTS,
  commitElement,
  elementsForSave,
  elementsFromScene,
  estimatePages,
  formatPages,
  knownCharacters,
  knownSluglines,
  makeElement,
  nextTypeAfter,
  tabTarget,
} from "../../lib/screenplay-editor";
import ElementBlock from "./ElementBlock";

interface ScreenplayEditorProps {
  scene: Scene | null;
  allScenes: Scene[];
  onFinishScene?: () => void;
}

type SaveStatus = "saved" | "dirty" | "saving" | "error";

const SAVE_DELAY_MS = 1000;

function caretOffset(node: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.endContainer)) return 0;
  const measure = range.cloneRange();
  measure.selectNodeContents(node);
  measure.setEnd(range.endContainer, range.endOffset);
  return measure.toString().length;
}

function hasSelection(): boolean {
  const selection = window.getSelection();
  return !!selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed;
}

function placeCaret(node: HTMLElement, offset: number) {
  let textNode = node.firstChild;
  if (!textNode) {
    textNode = document.createTextNode("");
    node.appendChild(textNode);
  }
  const length = textNode.textContent?.length ?? 0;
  const range = document.createRange();
  range.setStart(textNode, Math.max(0, Math.min(offset, length)));
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  node.focus();
}

/**
 * Block-based screenplay editor. Each element is its own editable block with
 * industry margins; Enter and Tab move between element types the way writers
 * expect from Final Draft, and the structured elements are what gets saved.
 */
const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({ scene, allScenes, onFinishScene }) => {
  const [blocks, setBlocks] = useState<ScreenplayElement[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [suggestions, setSuggestions] = useState<{ blockId: string; items: string[]; active: number } | null>(null);

  const blocksRef = useRef<ScreenplayElement[]>([]);
  const dirtyRef = useRef(false);
  const sceneIdRef = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const pendingCaret = useRef<{ id: string; offset: number } | null>(null);

  // Undo/redo: snapshots of the block list plus the caret to restore.
  type Snapshot = { blocks: ScreenplayElement[]; caret: { id: string; offset: number } | null };
  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; lastTyped: number; lastTypedId: string | null }>({
    past: [],
    future: [],
    lastTyped: 0,
    lastTypedId: null,
  });
  const HISTORY_LIMIT = 200;
  const updateScene = useUpdateSceneMutation();
  const mutateRef = useRef(updateScene.mutateAsync);
  mutateRef.current = updateScene.mutateAsync;

  blocksRef.current = blocks;

  const characters = useMemo(() => knownCharacters(allScenes), [allScenes]);
  const sluglines = useMemo(() => knownSluglines(allScenes), [allScenes]);

  // These callbacks are identity-stable (refs for everything that changes)
  // because an unmount cleanup depends on `flush`; a changing identity there
  // would re-run the cleanup, save, set state and loop.
  const persist = useCallback(async (sceneId: number, toSave: ScreenplayElement[]) => {
    dirtyRef.current = false;
    setStatus("saving");
    try {
      await mutateRef.current({ id: sceneId, elements: elementsForSave(toSave) });
      if (sceneIdRef.current === sceneId && !dirtyRef.current) setStatus("saved");
    } catch (error) {
      console.error("Failed to save scene", error);
      dirtyRef.current = true;
      setStatus("error");
    }
  }, []);

  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (dirtyRef.current && sceneIdRef.current) {
      void persist(sceneIdRef.current, blocksRef.current);
    }
  }, [persist]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (sceneIdRef.current && dirtyRef.current) void persist(sceneIdRef.current, blocksRef.current);
    }, SAVE_DELAY_MS);
  }, [persist]);

  // Load blocks when the scene changes; flush unsaved work from the previous one.
  useEffect(() => {
    flush();
    sceneIdRef.current = scene?.id ?? null;
    history.current = { past: [], future: [], lastTyped: 0, lastTypedId: null };
    dirtyRef.current = false;
    setStatus("saved");
    setSuggestions(null);
    setBlocks(scene ? elementsFromScene(scene) : []);
    setFocusId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  // Adopt server-side changes (heading edited in the header, formatting
  // applied) only while the writer is not inside the editor: replacing the
  // focused block's DOM text would throw the caret back to the start.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scene || dirtyRef.current || status === "saving") return;
    if (pageRef.current && document.activeElement && pageRef.current.contains(document.activeElement)) return;
    setBlocks(elementsFromScene(scene));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.updated_at]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      flush();
    };
  }, [flush]);

  useLayoutEffect(() => {
    const target = pendingCaret.current;
    if (!target) return;
    const node = nodes.current.get(target.id);
    if (node) {
      placeCaret(node, target.offset);
      setFocusId(target.id);
    }
    pendingCaret.current = null;
  }, [blocks]);

  // One stable registrar per block id, so ElementBlock's effect does not re-run on every keystroke.
  const registrars = useRef(new Map<string, (node: HTMLDivElement | null) => void>());
  const registrarFor = useCallback((id: string) => {
    let fn = registrars.current.get(id);
    if (!fn) {
      fn = (node: HTMLDivElement | null) => {
        if (node) nodes.current.set(id, node);
        else nodes.current.delete(id);
      };
      registrars.current.set(id, fn);
    }
    return fn;
  }, []);

  const currentCaret = useCallback((): { id: string; offset: number } | null => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return null;
    const entry = [...nodes.current.entries()].find(([, node]) => node === active);
    return entry ? { id: entry[0], offset: caretOffset(active) } : null;
  }, []);

  /**
   * Apply a change and record the previous state for undo. Consecutive
   * keystrokes in the same block within a second are coalesced into one
   * undo step, the way word processors do.
   */
  const replaceBlocks = useCallback(
    (updater: (current: ScreenplayElement[]) => ScreenplayElement[], options: { typing?: string } = {}) => {
      const h = history.current;
      const now = Date.now();
      const coalesce = options.typing && h.lastTypedId === options.typing && now - h.lastTyped < 1000;
      if (!coalesce) {
        h.past.push({ blocks: blocksRef.current, caret: currentCaret() });
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
        h.future = [];
      }
      h.lastTyped = options.typing ? now : 0;
      h.lastTypedId = options.typing ?? null;
      setBlocks((current) => updater(current));
      markDirty();
    },
    [currentCaret, markDirty]
  );

  const undo = useCallback(() => {
    const h = history.current;
    const snapshot = h.past.pop();
    if (!snapshot) return;
    h.future.push({ blocks: blocksRef.current, caret: currentCaret() });
    h.lastTypedId = null;
    pendingCaret.current = snapshot.caret;
    setBlocks(snapshot.blocks);
    markDirty();
  }, [currentCaret, markDirty]);

  const redo = useCallback(() => {
    const h = history.current;
    const snapshot = h.future.pop();
    if (!snapshot) return;
    h.past.push({ blocks: blocksRef.current, caret: currentCaret() });
    h.lastTypedId = null;
    pendingCaret.current = snapshot.caret;
    setBlocks(snapshot.blocks);
    markDirty();
  }, [currentCaret, markDirty]);

  const setType = useCallback(
    (index: number, type: ScreenplayElementType) => {
      const block = blocksRef.current[index];
      if (!block) return;
      const node = nodes.current.get(block.id as string);
      const offset = node ? caretOffset(node) : block.text.length;
      const formatted = softFormat(type, block.text);
      // Formatting may wrap the text in parentheses or append a colon. Keep a
      // caret that was at the end at the (inner) end, and one inside the text
      // at the same character.
      const innerEnd = type === "parenthetical" && formatted.endsWith(")") ? formatted.length - 1 : formatted.length;
      const wasAtEnd = offset >= block.text.length;
      let nextOffset = wasAtEnd ? innerEnd : offset + (formatted.startsWith("(") && !block.text.startsWith("(") ? 1 : 0);
      nextOffset = Math.max(0, Math.min(nextOffset, innerEnd));
      pendingCaret.current = { id: block.id as string, offset: nextOffset };
      replaceBlocks((current) => current.map((b, i) => (i === index ? { ...b, type, text: formatted } : b)));
      setSuggestions(null);
    },
    [replaceBlocks]
  );

  // Tab on a block that already has text starts a new element after it
  // (Final Draft behaviour); on an empty block it just changes the type.
  const insertAfter = useCallback(
    (index: number, type: ScreenplayElementType) => {
      const block = blocksRef.current[index];
      if (!block) return;
      const committed = commitElement(block, blocksRef.current[index - 1]?.type);
      const next = makeElement(type, type === "parenthetical" ? "()" : "");
      pendingCaret.current = { id: next.id as string, offset: type === "parenthetical" ? 1 : 0 };
      replaceBlocks((current) => [...current.slice(0, index), committed, next, ...current.slice(index + 1)]);
      setSuggestions(null);
    },
    [replaceBlocks]
  );

  const insertPageBreak = useCallback(
    (afterIndex: number) => {
      const pageBreak = makeElement("page_break", "");
      const next = makeElement("action", "");
      pendingCaret.current = { id: next.id as string, offset: 0 };
      replaceBlocks((current) => [...current.slice(0, afterIndex + 1), pageBreak, next, ...current.slice(afterIndex + 1)]);
    },
    [replaceBlocks]
  );

  const updateSuggestions = useCallback(
    (block: ScreenplayElement, text: string) => {
      const typed = text.trim().toUpperCase();
      let items: string[] = [];
      if (typed.length >= 1 && block.type === "character") {
        items = characters.filter((name) => name.startsWith(typed) && name !== typed).slice(0, 6);
      } else if (typed.length >= 3 && block.type === "slugline") {
        items = sluglines.filter((s) => s.startsWith(typed) && s !== typed).slice(0, 6);
      }
      setSuggestions(items.length ? { blockId: block.id as string, items, active: 0 } : null);
    },
    [characters, sluglines]
  );

  const handleInput = useCallback(
    (index: number, text: string) => {
      const typingId = blocksRef.current[index]?.id as string | undefined;
      replaceBlocks(
        (current) =>
          current.map((b, i) => {
            if (i !== index) return b;
            let type = b.type;
            // Live promotions writers expect: a heading prefix, a parenthetical in dialogue.
            if (type === "action" && /^(int|ext|i\/e)[.\s]/i.test(text)) type = "slugline";
            if (type === "dialogue" && text.startsWith("(")) type = "parenthetical";
            return { ...b, type, text };
          }),
        { typing: typingId }
      );
      const block = blocksRef.current[index];
      if (block) updateSuggestions({ ...block, text }, text);
    },
    [replaceBlocks, updateSuggestions]
  );

  const acceptSuggestion = useCallback(
    (index: number, value: string) => {
      const block = blocksRef.current[index];
      if (!block) return;
      pendingCaret.current = { id: block.id as string, offset: value.length };
      replaceBlocks((current) => current.map((b, i) => (i === index ? { ...b, text: value } : b)));
      setSuggestions(null);
    },
    [replaceBlocks]
  );

  // Commit on blur only records history when formatting actually changed
  // something; otherwise a plain focus move would wipe the redo stack.
  const commitAt = useCallback(
    (index: number) => {
      const current = blocksRef.current;
      const block = current[index];
      if (!block) return;
      const committed = commitElement(block, current[index - 1]?.type);
      if (committed.type === block.type && committed.text === block.text) return;
      replaceBlocks((list) => list.map((b, i) => (i === index ? committed : b)));
    },
    [replaceBlocks]
  );

  const handlePasteLines = useCallback(
    (index: number, lines: string[]): boolean => {
      const block = blocksRef.current[index];
      if (!block) return false;
      const node = nodes.current.get(block.id as string);
      const offset = node ? caretOffset(node) : block.text.length;
      const before = block.text.slice(0, offset);
      const after = block.text.slice(offset);

      const incoming: ScreenplayElement[] = [];
      let previousType: ScreenplayElementType | undefined = blocksRef.current[index - 1]?.type;
      lines.forEach((raw, i) => {
        const line = raw.trim();
        if (!line) return;
        const text = i === 0 ? before + line : line;
        const type = i === 0 && block.text.trim() ? block.type : detectElementType(text, previousType);
        incoming.push(makeElement(type, softFormat(type, text)));
        previousType = type;
      });
      if (incoming.length === 0) return false;
      if (after.trim()) incoming.push(makeElement(block.type, after));

      const last = incoming[incoming.length - 1];
      pendingCaret.current = { id: last.id as string, offset: last.text.length };
      replaceBlocks((current) => [...current.slice(0, index), ...incoming, ...current.slice(index + 1)]);
      return true;
    },
    [replaceBlocks]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
      const current = blocksRef.current;
      const block = current[index];
      if (!block) return;
      const node = e.currentTarget;

      if (suggestions && suggestions.blockId === block.id) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const delta = e.key === "ArrowDown" ? 1 : -1;
          setSuggestions({ ...suggestions, active: (suggestions.active + delta + suggestions.items.length) % suggestions.items.length });
          return;
        }
        if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey)) {
          e.preventDefault();
          acceptSuggestion(index, suggestions.items[suggestions.active]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSuggestions(null);
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        flush();
        onFinishScene?.();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && TYPE_SHORTCUTS[e.key]) {
        e.preventDefault();
        setType(index, TYPE_SHORTCUTS[e.key]);
        return;
      }

      if (e.key === "Enter" && e.shiftKey) {
        // A line break inside the element, kept as a newline character in state
        // (the browser would otherwise insert a <div>).
        e.preventDefault();
        const offset = caretOffset(node);
        pendingCaret.current = { id: block.id as string, offset: offset + 1 };
        replaceBlocks((list) =>
          list.map((b, i) => (i === index ? { ...b, text: b.text.slice(0, offset) + "\n" + b.text.slice(offset) } : b))
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const offset = caretOffset(node);
        const before = block.text.slice(0, offset);
        const after = block.text.slice(offset);

        // Enter on an empty cue means "I'm not writing dialogue after all".
        if (block.type === "character" && !before.trim()) {
          setType(index, "action");
          return;
        }

        const committed = commitElement({ ...block, text: before }, current[index - 1]?.type);
        // Never carry an auto-inserted closing paren or transition colon into the next block.
        const remainder =
          block.type === "parenthetical" ? after.replace(/^\s*\)\s*/, "")
          : block.type === "transition" ? after.replace(/^\s*:\s*/, "")
          : after;
        const next = makeElement(nextTypeAfter(committed.type), remainder.replace(/^\s+/, ""));
        pendingCaret.current = { id: next.id as string, offset: 0 };
        replaceBlocks((list) => [...list.slice(0, index), committed, next, ...list.slice(index + 1)]);
        setSuggestions(null);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const target = tabTarget(block.type, e.shiftKey);
        const empty = block.text.trim() === "" || block.text.trim() === "()";
        if (empty || e.shiftKey) setType(index, target);
        else insertAfter(index, target);
        return;
      }

      if (e.key === "Backspace" && !hasSelection() && caretOffset(node) === 0) {
        if (index === 0) return;
        e.preventDefault();
        const previous = current[index - 1];
        if (previous.type === "page_break") {
          pendingCaret.current = { id: block.id as string, offset: 0 };
          replaceBlocks((list) => list.filter((_, i) => i !== index - 1));
          return;
        }
        pendingCaret.current = { id: previous.id as string, offset: previous.text.length };
        replaceBlocks((list) => [
          ...list.slice(0, index - 1),
          { ...previous, text: previous.text + block.text },
          ...list.slice(index + 1),
        ]);
        return;
      }

      if (e.key === "Delete" && !hasSelection() && caretOffset(node) === block.text.length) {
        const following = current[index + 1];
        if (!following) return;
        e.preventDefault();
        pendingCaret.current = { id: block.id as string, offset: block.text.length };
        replaceBlocks((list) => [
          ...list.slice(0, index),
          { ...block, text: block.text + (following.type === "page_break" ? "" : following.text) },
          ...list.slice(index + 2),
        ]);
        return;
      }

      if (e.key === "ArrowUp" && index > 0 && caretOffset(node) === 0) {
        e.preventDefault();
        const target = current[index - 1].type === "page_break" ? current[index - 2] : current[index - 1];
        if (target) {
          const targetNode = nodes.current.get(target.id as string);
          if (targetNode) placeCaret(targetNode, target.text.length);
        }
        return;
      }

      if (e.key === "ArrowDown" && index < current.length - 1 && caretOffset(node) === block.text.length) {
        e.preventDefault();
        const target = current[index + 1].type === "page_break" ? current[index + 2] : current[index + 1];
        if (target) {
          const targetNode = nodes.current.get(target.id as string);
          if (targetNode) placeCaret(targetNode, 0);
        }
        return;
      }

      if (e.key === "Escape") {
        setSuggestions(null);
      }
    },
    [acceptSuggestion, flush, insertAfter, onFinishScene, redo, replaceBlocks, setType, suggestions, undo]
  );

  const focusedIndex = blocks.findIndex((b) => b.id === focusId);
  const focusedBlock = focusedIndex >= 0 ? blocks[focusedIndex] : null;
  const pages = useMemo(() => estimatePages(blocks), [blocks]);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-mono mb-2">No scene selected</p>
          <p className="text-xs text-gray-400 font-mono">Select a scene from the sidebar to start writing</p>
        </div>
      </div>
    );
  }

  const statusLabel: Record<SaveStatus, string> = {
    saved: "Saved",
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed, retrying on next change",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.background.beigeAlt }}>
      <style>{`
        .screenplay-block:empty::before { content: attr(data-placeholder); color: #B8BCC2; pointer-events: none; }
        .screenplay-page { font-family: "Courier Prime", Courier, "Courier New", monospace; font-size: 16px; line-height: 1.2; color: #111; }
      `}</style>

      {/* Element toolbar */}
      <div className="px-6 py-2 border-b-2 border-black bg-white flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <label htmlFor="element-type" className="uppercase font-bold text-gray-700">
            Element
          </label>
          <select
            id="element-type"
            value={focusedBlock && focusedBlock.type !== "page_break" ? focusedBlock.type : ""}
            disabled={!focusedBlock || focusedBlock.type === "page_break"}
            onChange={(e) => focusedIndex >= 0 && setType(focusedIndex, e.target.value as ScreenplayElementType)}
            className="border-2 border-black bg-white px-2 py-1 uppercase font-bold disabled:opacity-40"
          >
            <option value="" disabled>
              —
            </option>
            {TYPE_CYCLE.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => insertPageBreak(focusedIndex >= 0 ? focusedIndex : blocks.length - 1)}
            className="border-2 border-black bg-white px-2 py-1 uppercase font-bold hover:bg-gray-100"
            title="Insert a forced page break after this element"
          >
            Page break
          </button>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <span title="Estimated length at one page per minute">{formatPages(pages)}</span>
          <span
            className="uppercase font-bold"
            style={{ color: status === "error" ? colors.status.red : status === "saved" ? colors.status.green : colors.text.gray[500] }}
          >
            {statusLabel[status]}
          </span>
        </div>
      </div>

      {/* The page */}
      <div className="flex-1 overflow-y-auto py-8 px-6" onMouseDown={(e) => e.target === e.currentTarget && setFocusId(null)}>
        <div
          ref={pageRef}
          className="screenplay-page bg-white border-2 border-black mx-auto shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
          style={{ width: "min(100%, 78ch)", padding: "3.5rem 3.5rem 4rem 4.5rem" }}
        >
          {blocks.map((block, index) => (
            <div key={block.id} className="relative">
              <ElementBlock
                element={block}
                text={block.text}
                isFocused={block.id === focusId}
                previousType={blocks[index - 1]?.type}
                onInput={(text) => handleInput(index, text)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setFocusId(block.id as string)}
                onBlur={() => {
                  commitAt(index);
                  setTimeout(() => setSuggestions((s) => (s?.blockId === block.id ? null : s)), 150);
                }}
                onPasteLines={(lines) => handlePasteLines(index, lines)}
                registerNode={registrarFor(block.id as string)}
              />
              {block.id === focusId && block.type !== "page_break" && (
                <span
                  className="absolute -left-14 top-0 text-[9px] font-sans font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded select-none"
                  style={{ backgroundColor: colors.primary.pink }}
                  aria-hidden="true"
                >
                  {TYPE_LABELS[block.type].split(" ")[0]}
                </span>
              )}
              {suggestions && suggestions.blockId === block.id && (
                <ul
                  role="listbox"
                  className="absolute z-10 mt-1 bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-sm font-mono min-w-[20ch]"
                  style={{ left: block.type === "character" ? "22ch" : 0 }}
                >
                  {suggestions.items.map((item, i) => (
                    <li
                      key={item}
                      role="option"
                      aria-selected={i === suggestions.active}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        acceptSuggestion(index, item);
                      }}
                      className={`px-3 py-1 cursor-pointer ${i === suggestions.active ? "text-white" : "hover:bg-gray-100"}`}
                      style={i === suggestions.active ? { backgroundColor: colors.primary.pink } : undefined}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-1.5 border-t border-gray-300 bg-white text-[11px] font-mono text-gray-500 flex flex-wrap gap-x-5 gap-y-1">
        <span><b>Enter</b> next element</span>
        <span><b>Tab</b> change element</span>
        <span><b>⇧Enter</b> line break</span>
        <span><b>⌘1–7</b> set element</span>
        <span><b>⌘Z</b> undo · <b>⇧⌘Z</b> redo</span>
        <span><b>⌘Enter</b> next scene</span>
        <span>Type a name to autocomplete characters</span>
      </div>
    </div>
  );
};

export default ScreenplayEditor;
