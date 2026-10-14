import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../lib/theme";
import LoadingScreen from "../components/LoadingScreen";
import VersionsMenu from "../components/script-editor/VersionsMenu";
import AvRowTable from "../components/av/AvRowTable";
import ReviewPanel, { STATUS_META, roundStatus } from "../components/av/ReviewPanel";
import { useRevisionsQuery } from "../queries/versions/useVersionQueries";
import {
  avKeys,
  downloadShotList,
  useAddAvRowMutation,
  useAvRowsQuery,
  useDeleteAvRowMutation,
  useReorderAvRowsMutation,
  useReviewCommentsQuery,
  useReviewLinksQuery,
  useUpdateAvRowMutation,
  type AvRowFields,
} from "../queries/av/useAvQueries";
import type { AvRow, ReviewComment, Script } from "../types/api";

interface AvScriptEditorPageProps {
  script: Script;
  scriptVersionId: number;
}

const SAVE_DELAY_MS = 600;

/**
 * Two-column (audio/video) script editor for ads and promos: rows, rounds,
 * client review links and the shot list.
 */
const AvScriptEditorPage: React.FC<AvScriptEditorPageProps> = ({ script, scriptVersionId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useAvRowsQuery(scriptVersionId);
  const { data: revisions } = useRevisionsQuery(scriptVersionId);
  const { data: links = [] } = useReviewLinksQuery(scriptVersionId);
  const { data: comments = [] } = useReviewCommentsQuery(scriptVersionId);
  const addRow = useAddAvRowMutation(scriptVersionId);
  const updateRow = useUpdateAvRowMutation(scriptVersionId);
  const deleteRow = useDeleteAvRowMutation(scriptVersionId);
  const reorderRows = useReorderAvRowsMutation(scriptVersionId);

  const [panelOpen, setPanelOpen] = useState(true);
  const [focusRowId, setFocusRowId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [exporting, setExporting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pending = useRef<Map<number, { fields: AvRowFields; timer: ReturnType<typeof setTimeout> }>>(new Map());

  const version = script.script_versions?.find((v) => v.id === scriptVersionId);
  const revisedRowIds = useMemo(() => new Set<number>((revisions as { changed_row_ids?: number[] } | undefined)?.changed_row_ids || []), [revisions]);
  const commentsByRow = useMemo(() => {
    const map = new Map<number, ReviewComment[]>();
    comments.forEach((c) => {
      if (c.av_row_id) map.set(c.av_row_id, [...(map.get(c.av_row_id) || []), c]);
    });
    return map;
  }, [comments]);
  const status = roundStatus(links);
  const openComments = comments.filter((c) => !c.resolved_at).length;

  useEffect(() => {
    document.title = `${script.title} · Round ${version?.version_number ?? ""}`;
  }, [script.title, version?.version_number]);

  // Flush pending edits when leaving the page.
  useEffect(() => {
    const map = pending.current;
    return () => {
      map.forEach(({ fields, timer }, id) => {
        clearTimeout(timer);
        updateRow.mutate({ id, ...fields });
      });
      map.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptVersionId]);

  const handleChange = useCallback(
    (id: number, fields: Partial<AvRow>) => {
      // Paint the keystroke now; write to the server once typing pauses.
      queryClient.setQueryData<AvRow[]>(avKeys.rows(scriptVersionId), (current) => (current || []).map((r) => (r.id === id ? { ...r, ...fields } : r)));
      const entry = pending.current.get(id);
      if (entry) clearTimeout(entry.timer);
      const merged = { ...(entry?.fields || {}), ...fields } as AvRowFields;
      setSaveState("saving");
      const timer = setTimeout(async () => {
        pending.current.delete(id);
        try {
          await updateRow.mutateAsync({ id, ...merged });
          setSaveState(pending.current.size ? "saving" : "saved");
        } catch {
          setSaveState("error");
        }
      }, SAVE_DELAY_MS);
      pending.current.set(id, { fields: merged, timer });
    },
    [queryClient, scriptVersionId, updateRow]
  );

  const handleAddAfter = async (afterRowId: number | null) => {
    const row = await addRow.mutateAsync(afterRowId ? { after_row_id: afterRowId } : {});
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLTextAreaElement>(`[data-row-id="${row.id}"] textarea`);
      el?.focus();
    });
  };

  const handleDelete = (id: number) => {
    const row = rows.find((r) => r.id === id);
    const empty = row && !row.video.trim() && !row.audio.trim() && !(row.shot || "").trim();
    if (!empty && !window.confirm(`Delete row ${row?.position}? This cannot be undone.`)) return;
    deleteRow.mutate(id);
  };

  const handleMove = (id: number, direction: -1 | 1) => {
    const ids = rows.map((r) => r.id);
    const from = ids.indexOf(id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    reorderRows.mutate(ids);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadShotList(scriptVersionId);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  const statusMeta = status.status === "unshared" ? { label: "Not shared yet", bg: "#F3F4F6", fg: "#374151" } : STATUS_META[status.status];
  const btn = "px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase bg-white text-black hover:bg-gray-100 whitespace-nowrap disabled:opacity-50";

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: colors.background.beigeAlt }}>
      <header className="bg-white border-b-2 border-black px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <button type="button" onClick={() => navigate(`/scripts?project=${script.project_id}`)} className="p-1 border-2 border-transparent hover:border-gray-300 rounded" aria-label="Back to scripts" title="Back to scripts">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="min-w-0 flex-1 text-xs font-mono">
          <div className="font-bold uppercase truncate">
            {script.project_type || "Project"}
            {script.project_title ? ` · ${script.project_title}` : ""}
            <span className="ml-2 px-1.5 py-0.5 border border-black text-[9px] tracking-widest" style={{ backgroundColor: colors.background.beige }}>AV SCRIPT</span>
          </div>
          <div className="truncate text-gray-600 text-sm font-sans font-bold">{script.title}</div>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider hidden md:inline" style={{ color: saveState === "error" ? colors.status.red : colors.status.green }} aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}
        </span>
        <span className="text-[10px] font-bold uppercase px-2 py-1 border-2 border-black whitespace-nowrap" style={{ backgroundColor: statusMeta.bg, color: statusMeta.fg }} title={status.by ? `by ${status.by}` : undefined}>
          {statusMeta.label}
          {status.status !== "unshared" && status.status !== "pending" && status.pending > 0 ? ` · ${status.pending} pending` : ""}
        </span>
        <VersionsMenu script={script} scriptVersionId={scriptVersionId} kind="av" />
        <button type="button" onClick={exportCsv} disabled={exporting} className={btn} title="Download the shot list as CSV">{exporting ? "…" : "Shot list"}</button>
        <button type="button" onClick={() => window.open(`/scripts/${script.id}/versions/${scriptVersionId}/print`, "_blank", "noopener")} className={btn} title="Print or save as PDF">Print</button>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase text-white whitespace-nowrap"
          style={{ backgroundColor: colors.primary.pink }}
          aria-pressed={panelOpen}
        >
          Review{openComments ? ` · ${openComments}` : ""}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setHelpOpen((v) => !v)} className={btn} aria-expanded={helpOpen}>?</button>
          {helpOpen && (
            <div role="dialog" aria-label="How this works" className="absolute right-0 mt-2 w-80 bg-white border-2 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-40 p-4 text-xs leading-relaxed">
              <p className="font-bold uppercase mb-2">AV script</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                <li>Left column is what we <b>see</b>, right column is what we <b>hear</b>. One row per shot or beat.</li>
                <li>Seconds per row add up to the running time in the footer.</li>
                <li><kbd className="font-mono bg-gray-100 border px-1">⌘/Ctrl+Enter</kbd> adds a row below. Drag the number to reorder.</li>
                <li><b>Rounds</b> keep every version the client has seen. Rows changed since the last round are marked <i>revised</i>.</li>
                <li><b>Review</b> creates a link the client opens without an account to comment and approve.</li>
              </ul>
              <button type="button" onClick={() => setHelpOpen(false)} className="mt-3 px-2 py-1 border-2 border-black font-bold uppercase">Close</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {revisions?.previous_version && revisedRowIds.size > 0 && (
              <p className="text-[11px] font-mono text-gray-600 mb-3">
                {revisedRowIds.size} {revisedRowIds.size === 1 ? "row" : "rows"} revised since round {revisions.previous_version.version_number}. Use the Round menu to see exactly what changed.
              </p>
            )}
            <AvRowTable
              rows={rows}
              revisedRowIds={revisedRowIds}
              commentsByRow={commentsByRow}
              onChange={handleChange}
              onAddAfter={handleAddAfter}
              onDelete={handleDelete}
              onMove={handleMove}
              onReorder={(ids) => reorderRows.mutate(ids)}
              onShowComments={(rowId) => {
                setPanelOpen(true);
                setFocusRowId(rowId);
              }}
            />
          </div>
        </main>

        {panelOpen && (
          <aside className="w-[22rem] shrink-0 border-l-2 border-black bg-white overflow-y-auto p-4" aria-label="Client review">
            <ReviewPanel versionId={scriptVersionId} roundNumber={version?.version_number} rows={rows} focusRowId={focusRowId} onFocusHandled={() => setFocusRowId(null)} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default AvScriptEditorPage;
