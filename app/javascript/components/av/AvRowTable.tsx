import React, { useCallback, useEffect, useRef, useState } from "react";
import { colors } from "../../lib/theme";
import type { AvRow, ReviewComment } from "../../types/api";
import { formatSeconds } from "../../queries/av/useAvQueries";

interface AvRowTableProps {
  rows: AvRow[];
  revisedRowIds: Set<number>;
  commentsByRow: Map<number, ReviewComment[]>;
  readOnly?: boolean;
  onChange: (id: number, fields: Partial<AvRow>) => void;
  onAddAfter: (afterRowId: number | null) => void;
  onDelete: (id: number) => void;
  onMove: (id: number, direction: -1 | 1) => void;
  onReorder: (rowIds: number[]) => void;
  onShowComments: (rowId: number) => void;
}

/** Textarea that grows with its content and commits on each keystroke (debounced by the caller). */
const GrowingTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  readOnly?: boolean;
}> = ({ value, onChange, placeholder, ariaLabel, className = "", onKeyDown, readOnly }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      readOnly={readOnly}
      rows={1}
      className={`w-full resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-black rounded-sm placeholder:text-gray-400 ${className}`}
    />
  );
};

const AvRowTable: React.FC<AvRowTableProps> = ({ rows, revisedRowIds, commentsByRow, readOnly, onChange, onAddAfter, onDelete, onMove, onReorder, onShowComments }) => {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const total = rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);

  const handleDrop = useCallback(
    (targetId: number) => {
      if (dragId === null || dragId === targetId) return;
      const ids = rows.map((r) => r.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      onReorder(ids);
      setDragId(null);
      setOverId(null);
    },
    [dragId, rows, onReorder]
  );

  const cellKeys = (rowId: number) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onAddAfter(rowId);
    }
  };

  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
      <div className="grid grid-cols-[3.5rem_1fr_1fr] border-b-2 border-black bg-black text-white text-[11px] font-bold uppercase tracking-widest">
        <div className="px-2 py-2 text-center">#</div>
        <div className="px-3 py-2 border-l border-gray-700">Video</div>
        <div className="px-3 py-2 border-l border-gray-700">Audio</div>
      </div>

      {rows.length === 0 && (
        <div className="p-10 text-center font-mono text-sm text-gray-500">
          No rows yet.
          {!readOnly && (
            <button type="button" onClick={() => onAddAfter(null)} className="ml-2 underline font-bold text-black">Add the first row</button>
          )}
        </div>
      )}

      {rows.map((row, index) => {
        const comments = commentsByRow.get(row.id) || [];
        const openComments = comments.filter((c) => !c.resolved_at).length;
        const revised = revisedRowIds.has(row.id);
        return (
          <div
            key={row.id}
            data-row-id={row.id}
            className={`group relative grid grid-cols-[3.5rem_1fr_1fr] border-b-2 border-black last:border-b-0 ${overId === row.id && dragId !== row.id ? "outline outline-2 outline-dashed outline-pink-500 -outline-offset-2" : ""}`}
            style={{ backgroundColor: revised ? "#FFF7F9" : undefined }}
            onDragOver={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              setOverId(row.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(row.id);
            }}
          >
            {/* Number / duration column */}
            <div className="flex flex-col items-center justify-start gap-1 px-1 py-2 border-r-2 border-black" style={{ backgroundColor: colors.background.beigeAlt }}>
              <div
                draggable={!readOnly}
                onDragStart={(e) => {
                  setDragId(row.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                title={readOnly ? undefined : "Drag to reorder"}
                className={`w-8 h-8 flex items-center justify-center font-black text-sm text-white border-2 border-black ${readOnly ? "" : "cursor-grab active:cursor-grabbing"}`}
                style={{ backgroundColor: colors.primary.pink }}
                aria-label={`Row ${row.position}`}
              >
                {row.position}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={row.duration_seconds ?? ""}
                readOnly={readOnly}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  onChange(row.id, { duration_seconds: v === "" ? null : Math.min(parseInt(v, 10), 3600) });
                }}
                placeholder="sec"
                aria-label={`Row ${row.position} duration in seconds`}
                title="Duration (seconds)"
                className="w-11 text-center text-[11px] font-mono border border-gray-300 bg-white px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              />
              {revised && <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: colors.primary.pink }}>revised</span>}
            </div>

            {/* Video column */}
            <div className="px-1 py-1.5 border-r-2 border-black flex flex-col gap-0.5">
              <input
                type="text"
                value={row.shot ?? ""}
                readOnly={readOnly}
                onChange={(e) => onChange(row.id, { shot: e.target.value })}
                placeholder="SHOT (WS / MS / CU)"
                aria-label={`Row ${row.position} shot`}
                className="w-full bg-transparent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider font-mono text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black rounded-sm placeholder:text-gray-400 placeholder:font-normal"
              />
              <GrowingTextarea value={row.video} onChange={(v) => onChange(row.id, { video: v })} placeholder="What we see" ariaLabel={`Row ${row.position} video`} onKeyDown={cellKeys(row.id)} readOnly={readOnly} />
              <input
                type="text"
                value={row.super_text ?? ""}
                readOnly={readOnly}
                onChange={(e) => onChange(row.id, { super_text: e.target.value })}
                placeholder="SUPER: on-screen text"
                aria-label={`Row ${row.position} super`}
                className="w-full bg-transparent px-2 py-0.5 text-[11px] font-mono uppercase text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black rounded-sm placeholder:text-gray-400 placeholder:normal-case"
              />
            </div>

            {/* Audio column */}
            <div className="px-1 py-1.5 flex flex-col">
              <GrowingTextarea value={row.audio} onChange={(v) => onChange(row.id, { audio: v })} placeholder="VO / dialogue / music / SFX" ariaLabel={`Row ${row.position} audio`} onKeyDown={cellKeys(row.id)} readOnly={readOnly} className="flex-1" />
              <div className="flex items-center justify-between gap-2 px-2 pt-1">
                {comments.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onShowComments(row.id)}
                    className="text-[11px] font-mono font-bold uppercase px-1.5 py-0.5 border-2 border-black bg-white hover:bg-black hover:text-white"
                    style={openComments ? { backgroundColor: "#FEF3C7" } : undefined}
                    title="Client comments on this row"
                  >
                    {openComments ? `${openComments} open` : `${comments.length} resolved`} · comments
                  </button>
                ) : (
                  <span />
                )}
                {!readOnly && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-[11px] font-mono uppercase">
                    <button type="button" onClick={() => onMove(row.id, -1)} disabled={index === 0} className="px-1.5 py-0.5 border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30" aria-label="Move row up" title="Move up">↑</button>
                    <button type="button" onClick={() => onMove(row.id, 1)} disabled={index === rows.length - 1} className="px-1.5 py-0.5 border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30" aria-label="Move row down" title="Move down">↓</button>
                    <button type="button" onClick={() => onAddAfter(row.id)} className="px-1.5 py-0.5 border-2 border-black bg-white hover:bg-gray-100 font-bold" aria-label="Add row below" title="Add row below (⌘/Ctrl+Enter)">+ row</button>
                    <button type="button" onClick={() => onDelete(row.id)} className="px-1.5 py-0.5 border-2 border-black bg-white hover:bg-red-50 font-bold" style={{ color: colors.status.red }} aria-label="Delete row" title="Delete row">×</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-[3.5rem_1fr_1fr] border-t-2 border-black text-[11px] font-mono uppercase tracking-wider" style={{ backgroundColor: colors.background.beige }}>
        <div className="px-2 py-2 text-center font-bold">{formatSeconds(total)}</div>
        <div className="px-3 py-2 border-l-2 border-black text-gray-600">
          {rows.length} {rows.length === 1 ? "row" : "rows"} · total running time
        </div>
        <div className="px-3 py-2 border-l-2 border-black text-right">
          {!readOnly && (
            <button type="button" onClick={() => onAddAfter(rows[rows.length - 1]?.id ?? null)} className="px-2 py-0.5 border-2 border-black bg-white hover:bg-black hover:text-white font-bold">+ Add row</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvRowTable;
