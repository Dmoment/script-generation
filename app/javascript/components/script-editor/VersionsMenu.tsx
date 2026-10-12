import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../lib/theme";
import type { Script, ScriptVersion } from "../../types/api";
import { useCompareQuery, useCreateVersionMutation, type DiffScene } from "../../queries/versions/useVersionQueries";
import { cueText } from "../../lib/screenplay-editor";

interface VersionsMenuProps {
  script: Script | undefined;
  scriptVersionId: number;
}

/**
 * Drafts: switch between versions, start a new draft from the current one,
 * and compare the current draft with any earlier one.
 */
const VersionsMenu: React.FC<VersionsMenuProps> = ({ script, scriptVersionId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [compareWith, setCompareWith] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const createVersion = useCreateVersionMutation();

  const versions: ScriptVersion[] = [...(script?.script_versions || [])].sort((a, b) => b.version_number - a.version_number);
  const current = versions.find((v) => v.id === scriptVersionId);
  const earlier = versions.filter((v) => current && v.version_number < current.version_number);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const startDraft = async () => {
    if (!script) return;
    setCreating(true);
    try {
      const version = await createVersion.mutateAsync({ scriptId: script.id, sourceVersionId: scriptVersionId, notes: notes.trim() || undefined });
      setOpen(false);
      setNotes("");
      navigate(`/scripts/${script.id}/versions/${version.id}`);
    } catch (error) {
      console.error("Could not create draft", error);
    } finally {
      setCreating(false);
    }
  };

  const item = "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between gap-3";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase bg-white text-black hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap"
        title="Drafts: switch, start a new draft, compare"
      >
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary.pink }} aria-hidden="true" />
        {current ? `Draft ${current.version_number}` : "Drafts"}
        <span className="font-mono text-gray-500 normal-case">{versions.length ? `of ${versions.length}` : ""}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-80 bg-white border-2 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-30 py-1">
          <div className="px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">Switch draft</div>
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                if (v.id !== scriptVersionId) navigate(`/scripts/${script!.id}/versions/${v.id}`);
              }}
            >
              <span className="font-bold uppercase whitespace-nowrap">
                Draft {v.version_number}
                {v.id === scriptVersionId && <span className="ml-2 text-[10px] text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.primary.pink }}>open</span>}
              </span>
              <span className="font-mono text-xs text-gray-500 truncate max-w-[9rem]" title={v.notes || ""}>{v.notes || new Date(v.created_at).toLocaleDateString()}</span>
            </button>
          ))}

          <div className="border-t-2 border-black my-1" />
          <div className="px-4 pt-1 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">New draft from this one</div>
          <form
            className="px-4 pb-2 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              void startDraft();
            }}
          >
            <input
              className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Notes (e.g. producer's notes pass)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Draft notes"
            />
            <button type="submit" disabled={creating || !script} className="px-2 border-2 border-black text-white text-xs font-bold uppercase disabled:opacity-50" style={{ backgroundColor: colors.primary.pink }}>
              {creating ? "…" : "Start"}
            </button>
          </form>

          {earlier.length > 0 && (
            <>
              <div className="border-t-2 border-black my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">Compare with</div>
              {earlier.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="menuitem"
                  className={item}
                  onClick={() => {
                    setOpen(false);
                    setCompareWith(v.id);
                  }}
                >
                  <span className="font-bold uppercase">Draft {v.version_number}</span>
                  <span className="font-mono text-xs text-gray-500">show changes</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {compareWith && <CompareModal versionId={scriptVersionId} withId={compareWith} onClose={() => setCompareWith(null)} />}
    </div>
  );
};

const STATUS_STYLE: Record<DiffScene["status"], { label: string; color: string }> = {
  changed: { label: "Revised", color: "#2A4DD0" },
  added: { label: "New", color: "#16A34A" },
  removed: { label: "Removed", color: "#DC2626" },
  unchanged: { label: "Unchanged", color: "#9CA3AF" },
};

const CompareModal: React.FC<{ versionId: number; withId: number; onClose: () => void }> = ({ versionId, withId, onClose }) => {
  const { data, isLoading, error } = useCompareQuery(versionId, withId);
  const [showUnchanged, setShowUnchanged] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const scenes = (data?.scenes || []).filter((s) => showUnchanged || s.status !== "unchanged");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Compare drafts">
      <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between gap-4" style={{ backgroundColor: colors.background.beige }}>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">
              {data ? `Draft ${data.target.version_number} vs draft ${data.base.version_number}` : "Comparing drafts…"}
            </h2>
            {data && (
              <p className="text-xs font-mono text-gray-600 mt-1">
                {Object.entries(data.summary).map(([status, count]) => `${count} ${STATUS_STYLE[status as DiffScene["status"]].label.toLowerCase()}`).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono flex items-center gap-1">
              <input type="checkbox" checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} /> show unchanged
            </label>
            <button type="button" onClick={onClose} className="w-8 h-8 border-2 border-black bg-white hover:bg-gray-100 font-bold" aria-label="Close">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm" style={{ backgroundColor: colors.background.beigeAlt }}>
          {isLoading && <p className="text-gray-500">Comparing…</p>}
          {error && <p style={{ color: colors.status.red }}>{error.message}</p>}
          {data && scenes.length === 0 && <p className="text-gray-600">No differences between these drafts.</p>}
          {scenes.map((scene) => {
            const style = STATUS_STYLE[scene.status];
            return (
              <section key={`${scene.status}-${scene.target_scene_id ?? scene.base_scene_id}`} className="bg-white border-2 border-black mb-4">
                <header className="px-4 py-2 border-b-2 border-black flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: style.color }}>{style.label}</span>
                  <span className="font-bold uppercase">{scene.scene_number}. {scene.slugline || "(no heading)"}</span>
                </header>
                {scene.status !== "unchanged" && (
                  <div className="px-4 py-3 whitespace-pre-wrap leading-relaxed">
                    {scene.changes.map((change, i) => {
                      const el = change.element;
                      const text = el.type === "character" ? cueText(el) : el.text;
                      const indent = el.type === "character" ? "pl-[22ch]" : el.type === "dialogue" ? "pl-[10ch] pr-[15ch]" : el.type === "parenthetical" ? "pl-[16ch]" : el.type === "transition" ? "text-right" : "";
                      const bg = change.op === "add" ? "#DCFCE7" : change.op === "del" ? "#FEE2E2" : "transparent";
                      const decoration = change.op === "del" ? "line-through" : "none";
                      return (
                        <div key={i} className={`py-0.5 px-1 -mx-1 ${indent} ${el.type === "slugline" || el.type === "character" ? "uppercase" : ""}`} style={{ backgroundColor: bg, textDecoration: decoration, opacity: change.op === "same" ? 0.6 : 1 }}>
                          <span className="inline-block w-4 text-gray-400 select-none">{change.op === "add" ? "+" : change.op === "del" ? "−" : " "}</span>
                          {text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VersionsMenu;
