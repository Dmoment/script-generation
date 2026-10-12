import React, { useLayoutEffect, useRef } from "react";
import type { ScreenplayElement, ScreenplayElementType } from "../../types/api";
import { PLACEHOLDERS } from "../../lib/screenplay-editor";

interface ElementBlockProps {
  element: ScreenplayElement;
  text: string;
  isFocused: boolean;
  previousType?: ScreenplayElementType;
  onInput: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPasteLines: (lines: string[]) => boolean;
  registerNode: (node: HTMLDivElement | null) => void;
}

/**
 * Industry layout, expressed in character cells of a 60-character line
 * (8.5x11 page, 1.5in left margin, 12pt Courier). Values are inches from the
 * left text margin converted to `ch`.
 */
const BLOCK_STYLE: Record<ScreenplayElementType, React.CSSProperties> = {
  slugline: { textTransform: "uppercase", marginTop: "1.2em" },
  action: { marginTop: "1.2em" },
  character: { textTransform: "uppercase", marginLeft: "22ch", marginTop: "1.2em" },
  parenthetical: { marginLeft: "16ch", width: "26ch" },
  dialogue: { marginLeft: "10ch", width: "35ch" },
  transition: { textTransform: "uppercase", textAlign: "right", marginTop: "1.2em" },
  centered: { textAlign: "center", marginTop: "1.2em" },
  page_break: {},
};

function serialise(node: HTMLElement): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
    } else if (child.nodeName === "BR") {
      out += "\n";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      if (out.length && !out.endsWith("\n")) out += "\n";
      out += serialise(child as HTMLElement);
    }
  });
  return out;
}

/**
 * A contenteditable cannot place the caret on a trailing empty line, so text
 * that ends with a newline is rendered with one extra phantom newline.
 */
export function domTextFor(text: string): string {
  return text.endsWith("\n") ? text + "\n" : text;
}

/** Serialise a block's DOM to text (browser-made <br>/<div> become newlines; the phantom newline is dropped). */
export function readBlockText(node: HTMLElement): string {
  const out = serialise(node);
  return out.endsWith("\n") ? out.slice(0, -1) : out;
}

const ElementBlock: React.FC<ElementBlockProps> = ({
  element,
  text,
  isFocused,
  previousType,
  onInput,
  onKeyDown,
  onFocus,
  onBlur,
  onPasteLines,
  registerNode,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the DOM text in step with state without clobbering the caret while
  // typing: the two only differ after a programmatic change (format, merge).
  useLayoutEffect(() => {
    const node = ref.current;
    const domText = domTextFor(text);
    if (!node || node.textContent === domText) return;
    // Preserve the caret when the text is replaced under a focused block.
    const focused = document.activeElement === node;
    let offset = 0;
    if (focused) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.selectNodeContents(node);
        range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
        offset = range.toString().length;
      }
    }
    node.textContent = domText;
    if (focused && node.firstChild) {
      const range = document.createRange();
      range.setStart(node.firstChild, Math.min(offset, domText.length));
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [text]);

  useLayoutEffect(() => {
    registerNode(ref.current);
    return () => registerNode(null);
  }, [registerNode]);

  if (element.type === "page_break") {
    return (
      <div
        className="my-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-gray-400 select-none"
        aria-label="Page break"
      >
        <span className="flex-1 border-t border-dashed border-gray-300" />
        Page break
        <span className="flex-1 border-t border-dashed border-gray-300" />
      </div>
    );
  }

  const style: React.CSSProperties = { ...BLOCK_STYLE[element.type] };
  // Dialogue that directly follows a cue sits tight under it.
  if (
    (element.type === "dialogue" || element.type === "parenthetical") &&
    (previousType === "character" || previousType === "parenthetical" || previousType === "dialogue")
  ) {
    style.marginTop = 0;
  } else if (element.type === "dialogue" || element.type === "parenthetical") {
    style.marginTop = "1.2em";
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const plain = e.clipboardData.getData("text/plain");
    if (!plain) return;
    e.preventDefault();
    const lines = plain.replace(/\r/g, "").split("\n");
    if (lines.length > 1 && onPasteLines(lines)) return;
    document.execCommand("insertText", false, plain.replace(/\n+/g, " "));
  };

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={element.type}
      data-element-type={element.type}
      data-placeholder={PLACEHOLDERS[element.type]}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={element.type === "action" || element.type === "dialogue"}
      className={`screenplay-block outline-none whitespace-pre-wrap break-words min-h-[1.2em] rounded-sm px-1 -mx-1 ${
        isFocused ? "bg-[#FFF7F9]" : ""
      }`}
      style={style}
      onInput={(e) => onInput(readBlockText(e.currentTarget))}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onPaste={handlePaste}
    />
  );
};

export default React.memo(ElementBlock);
