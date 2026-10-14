import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../lib/theme";
import ExportMenu from "./ExportMenu";
import VersionsMenu from "./VersionsMenu";
import type { Script } from "../../types/api";

export type EditorTab = "scenes" | "script" | "characters" | "outline" | "breakdown";

interface ScriptEditorHeaderProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onFormatScript?: () => void;
  scriptId?: string | number;
  scriptVersionId?: number;
  script?: Script;
}

const TABS: Array<{ id: EditorTab; label: string; path: string }> = [
  { id: "scenes", label: "Scenes", path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "script", label: "Script", path: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { id: "characters", label: "Characters", path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "outline", label: "Outline", path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "breakdown", label: "Breakdown", path: "M4 6h16M4 10h16M4 14h10M4 18h6" },
];

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

const SHORTCUTS: Array<[string, string]> = [
  ["Enter", "New line; after a heading or cue the next element is chosen for you"],
  ["Tab", "Cycle action → character → parenthetical → dialogue"],
  ["Shift+Enter", "Line break inside the same element"],
  [`${MOD}+1 … ${MOD}+7`, "Set element: heading, action, character, parenthetical, dialogue, transition, centered"],
  [`${MOD}+Z / ${MOD}+Shift+Z`, "Undo / redo (also " + MOD + "+Y)"],
  [`${MOD}+Enter`, "Jump to the next scene"],
  ["Type INT. / EXT.", "Starts a scene heading; type a name in caps for a character cue"],
  ["Esc", "Close autocomplete or this panel"],
];

const ScriptEditorHeader: React.FC<ScriptEditorHeaderProps> = ({
  activeTab,
  onTabChange,
  onFormatScript,
  scriptId,
  scriptVersionId,
  script,
}) => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!helpOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setHelpOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [helpOpen]);

  const fullTitle = script ? [script.project_type, script.project_title, script.title].filter(Boolean).join(" · ") : "";

  return (
    <div className="bg-white border-b-2 border-black px-4 py-2.5 flex items-center gap-3 shadow-sm">
      <nav className="flex items-center gap-2 shrink-0" aria-label="Editor views">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border-2 font-bold uppercase text-sm ${
                active ? "text-white border-black" : "text-gray-700 border-gray-300 hover:border-gray-400 bg-white"
              }`}
              style={active ? { backgroundColor: colors.primary.pink } : {}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.path} />
              </svg>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1 min-w-0 text-xs text-gray-700 font-mono hidden md:block text-right" title={fullTitle || undefined}>
        <div className="font-bold uppercase truncate">
          {script?.project_type || "Project"}
          {script?.project_title ? ` · ${script.project_title}` : ""}
        </div>
        <div className="mt-0.5 truncate text-gray-500">{script?.title || ""}</div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!!scriptVersionId && <VersionsMenu script={script} scriptVersionId={scriptVersionId} />}
        {scriptId !== undefined && !!scriptVersionId && <ExportMenu scriptId={scriptId} scriptVersionId={scriptVersionId} />}
        {onFormatScript && (
          <button
            type="button"
            onClick={onFormatScript}
            className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase transition-colors bg-white text-black hover:bg-gray-100 flex items-center gap-2"
            title="Format Script - Apply industry-standard formatting"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span className="hidden xl:inline">Format</span>
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase transition-colors text-white"
            style={{ backgroundColor: helpOpen ? colors.primary.pinkDark : colors.primary.pink }}
            title="Keyboard shortcuts"
          >
            Help
          </button>
          {helpOpen && (
            <div
              role="dialog"
              aria-label="Keyboard shortcuts"
              className="absolute right-0 mt-2 w-[26rem] max-w-[90vw] bg-white border-2 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-40 p-4 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black uppercase tracking-tight">Keyboard shortcuts</h3>
                <button type="button" onClick={() => setHelpOpen(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-gray-100 font-bold" aria-label="Close">×</button>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
                {SHORTCUTS.map(([keys, what]) => (
                  <React.Fragment key={keys}>
                    <dt className="font-mono font-bold whitespace-nowrap bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 self-start">{keys}</dt>
                    <dd className="text-gray-700 leading-snug">{what}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="mt-3 text-[11px] text-gray-500 font-mono">Everything you type is saved automatically. Drafts, export and print live in the buttons to the left.</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/scripts")}
          className="text-gray-700 hover:text-black transition-colors p-1 border-2 border-transparent hover:border-gray-300 rounded"
          title="Back to scripts"
          aria-label="Back to scripts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ScriptEditorHeader;
