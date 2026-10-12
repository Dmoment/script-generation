import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../../lib/theme";
import type { Scene, SceneMetadata } from "../../types/api";
import { useUpdateSceneMutation } from "../../queries/scenes/useUpdateSceneMutation";
import { invalidateSceneDerived } from "../../queries/versions/useVersionQueries";
import SceneComments from "./SceneComments";
import { useSceneCommentsQuery } from "../../queries/scenes/useSceneCommentsQuery";

interface SceneMetadataSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scene: Scene | null;
  sceneIndex: number;
  totalScenes: number;
  currentUserId?: string;
}

/** Breakdown categories a crew tags per scene. Cast is read from the script itself. */
export const BREAKDOWN_CATEGORIES: Array<{ key: string; label: string; color: string; hint: string }> = [
  { key: "extras", label: "Extras", color: "#8B5CF6", hint: "Background and non-speaking" },
  { key: "props", label: "Props", color: "#B45309", hint: "Anything a character handles" },
  { key: "costumes", label: "Costumes", color: "#F97316", hint: "Wardrobe specific to the scene" },
  { key: "makeup", label: "Makeup & hair", color: "#EC4899", hint: "Looks, wounds, ageing" },
  { key: "vehicles", label: "Vehicles", color: "#14B8A6", hint: "Cars, boats, bikes" },
  { key: "stunts", label: "Stunts", color: "#EF4444", hint: "Anything needing a coordinator" },
  { key: "sfx", label: "SPFX / VFX", color: "#22C55E", hint: "Practical and visual effects" },
  { key: "music", label: "Music", color: "#4ADE80", hint: "Source music and cues" },
  { key: "locations", label: "Locations", color: "#0EA5E9", hint: "Beyond the heading" },
];

const TONES = ["Calm", "Warm", "Cool", "Tense", "Intense", "Neutral"];
const STATUSES = ["Draft", "Revised", "Locked"];
const ACTS = ["Act 1", "Act 2", "Act 3"];

const SAVE_DELAY_MS = 800;

const SceneMetadataSidebar: React.FC<SceneMetadataSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  scene,
  sceneIndex,
  totalScenes,
  currentUserId,
}) => {
  const { data: commentThreads = [] } = useSceneCommentsQuery(scene?.id ?? null);
  const openComments = commentThreads.filter((t) => !t.resolved_at).length;
  const queryClient = useQueryClient();
  const updateScene = useUpdateSceneMutation();
  const [draft, setDraft] = useState<SceneMetadata>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ general: true });
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<SceneMetadata>({});
  const sceneIdRef = useRef<number | null>(null);
  draftRef.current = draft;

  // Load the scene's metadata when the scene changes (flushing pending edits first).
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      if (sceneIdRef.current) void persist(sceneIdRef.current, draftRef.current);
    }
    sceneIdRef.current = scene?.id ?? null;
    setDraft(scene?.metadata ? { ...scene.metadata } : {});
    setStatus("saved");
    setNewItem({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  const persist = async (sceneId: number, metadata: SceneMetadata) => {
    setStatus("saving");
    try {
      await updateScene.mutateAsync({ id: sceneId, metadata });
      invalidateSceneDerived(queryClient, scene?.script_version_id ?? 0);
      setStatus("saved");
    } catch (error) {
      console.error("Failed to save scene details", error);
      setStatus("dirty");
    }
  };

  const change = (patch: Partial<SceneMetadata>) => {
    if (!scene) return;
    const next = { ...draftRef.current, ...patch };
    setDraft(next);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void persist(scene.id, next);
    }, SAVE_DELAY_MS);
  };

  const breakdown = useMemo(() => (draft.breakdown || {}) as Record<string, string[]>, [draft.breakdown]);

  const addItem = (category: string) => {
    const value = (newItem[category] || "").trim();
    if (!value) return;
    const list = breakdown[category] || [];
    if (list.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setNewItem((n) => ({ ...n, [category]: "" }));
      return;
    }
    change({ breakdown: { ...breakdown, [category]: [...list, value] } });
    setNewItem((n) => ({ ...n, [category]: "" }));
  };

  const removeItem = (category: string, item: string) => {
    change({ breakdown: { ...breakdown, [category]: (breakdown[category] || []).filter((i) => i !== item) } });
  };

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l-2 border-black flex flex-col items-center py-4 shadow-[-2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
        <button onClick={onToggleCollapse} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Expand scene details">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    );
  }

  const field = "w-full border-2 border-black bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black";
  const label = "block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1";

  return (
    <div className="w-80 bg-white border-l-2 border-black overflow-y-auto shadow-[-2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200 flex flex-col">
      <div className="p-4 border-b-2 border-black flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 className="text-sm font-black uppercase text-black tracking-tight">
            Scene {sceneIndex} / {totalScenes}
          </h3>
          <span
            className="text-[10px] font-mono uppercase font-bold"
            style={{ color: status === "saved" ? colors.status.green : colors.text.gray[500] }}
          >
            {status === "saved" ? "Details saved" : status === "saving" ? "Saving…" : "Unsaved"}
          </span>
        </div>
        <button onClick={onToggleCollapse} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Collapse scene details">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {!scene ? (
        <p className="p-4 text-sm text-gray-500 font-mono">No scene selected</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {/* General information */}
          <Section title="General information" color="#3B82F6" open={!!open.general} onToggle={() => toggle("general")}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label} htmlFor="meta-act">Act</label>
                <select id="meta-act" className={field} value={(draft.act as string) || ""} onChange={(e) => change({ act: e.target.value || undefined })}>
                  <option value="">—</option>
                  {ACTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="meta-status">Status</label>
                <select id="meta-status" className={field} value={(draft.status as string) || ""} onChange={(e) => change({ status: e.target.value || undefined })}>
                  <option value="">—</option>
                  {STATUSES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="meta-tone">Tone</label>
                <select id="meta-tone" className={field} value={(draft.tone as string) || ""} onChange={(e) => change({ tone: e.target.value || undefined })}>
                  <option value="">—</option>
                  {TONES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="meta-duration">Est. time</label>
                <input id="meta-duration" className={field} placeholder="1:30" value={(draft.duration as string) || ""} onChange={(e) => change({ duration: e.target.value })} />
              </div>
            </div>
            <div className="mt-2">
              <label className={label} htmlFor="meta-purpose">Purpose</label>
              <input id="meta-purpose" className={field} placeholder="What this scene must do" value={(draft.purpose as string) || ""} onChange={(e) => change({ purpose: e.target.value })} />
            </div>
            <div className="mt-2">
              <label className={label} htmlFor="meta-summary">Summary</label>
              <textarea id="meta-summary" className={`${field} min-h-[64px]`} placeholder="One or two lines for the index card" value={(draft.summary as string) || ""} onChange={(e) => change({ summary: e.target.value })} />
            </div>
          </Section>

          {/* Comments */}
          <Section title="Comments" color={colors.primary.pink} count={openComments} open={!!open.comments} onToggle={() => toggle("comments")}>
            <SceneComments sceneId={scene.id} currentUserId={currentUserId} />
          </Section>

          {/* Notes */}
          <Section title="Scene notes" color="#9CA3AF" open={!!open.notes} onToggle={() => toggle("notes")}>
            <textarea className={`${field} min-h-[96px]`} placeholder="Notes for the writer or the crew" value={(draft.notes as string) || ""} onChange={(e) => change({ notes: e.target.value })} aria-label="Scene notes" />
          </Section>

          {/* Cast: read from the script */}
          <Section title="Cast" color="#8B5CF6" count={(scene.character_names || []).length} open={!!open.cast} onToggle={() => toggle("cast")}>
            {(scene.character_names || []).length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No character cues in this scene yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {(scene.character_names || []).map((name) => (
                  <li key={name} className="px-2 py-0.5 text-xs font-mono border-2 border-black bg-white uppercase">{name}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] text-gray-500 font-mono">From the character cues in the scene. Add background in Extras.</p>
          </Section>

          {/* Breakdown categories */}
          {BREAKDOWN_CATEGORIES.map((category) => {
            const items = breakdown[category.key] || [];
            return (
              <Section
                key={category.key}
                title={category.label}
                color={category.color}
                count={items.length}
                open={!!open[category.key]}
                onToggle={() => toggle(category.key)}
              >
                <ul className="flex flex-wrap gap-1.5 mb-2">
                  {items.map((item) => (
                    <li key={item} className="pl-2 pr-1 py-0.5 text-xs font-mono border-2 border-black bg-white flex items-center gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeItem(category.key, item)}
                        className="w-4 h-4 leading-none text-gray-500 hover:text-black"
                        aria-label={`Remove ${item}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="flex gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addItem(category.key);
                  }}
                >
                  <input
                    className={field}
                    placeholder={category.hint}
                    value={newItem[category.key] || ""}
                    onChange={(e) => setNewItem((n) => ({ ...n, [category.key]: e.target.value }))}
                    aria-label={`Add ${category.label}`}
                  />
                  <button type="submit" className="px-2 border-2 border-black bg-white text-xs font-bold uppercase hover:bg-gray-100" title="Add (Enter)">
                    Add
                  </button>
                </form>
              </Section>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{
  title: string;
  color: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, color, count, open, onToggle, children }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="text-sm text-black font-medium flex-1">
        {title}
        {typeof count === "number" && count > 0 && <span className="text-gray-600 ml-1 font-normal">({count})</span>}
      </span>
      <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
    {open && <div className="px-4 pb-4">{children}</div>}
  </div>
);

export default SceneMetadataSidebar;
