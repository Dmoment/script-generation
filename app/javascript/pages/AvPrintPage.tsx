import React, { useEffect } from "react";
import { useAvRowsQuery, useReviewLinksQuery, formatSeconds } from "../queries/av/useAvQueries";
import { roundStatus } from "../components/av/ReviewPanel";
import LoadingScreen from "../components/LoadingScreen";
import type { Script } from "../types/api";

interface AvPrintPageProps {
  script: Script;
  scriptVersionId: number;
}

/** Print / PDF view of an AV script: title block, then the two-column table. */
const AvPrintPage: React.FC<AvPrintPageProps> = ({ script, scriptVersionId }) => {
  const { data: rows = [], isLoading } = useAvRowsQuery(scriptVersionId);
  const { data: links = [] } = useReviewLinksQuery(scriptVersionId);
  const version = script.script_versions?.find((v) => v.id === scriptVersionId);
  const status = roundStatus(links);
  const total = rows.reduce((s, r) => s + (r.duration_seconds || 0), 0);

  useEffect(() => {
    document.title = `${script.title} – round ${version?.version_number ?? ""}`;
  }, [script.title, version?.version_number]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="print-root">
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        .print-root { background: #e5e7eb; min-height: 100vh; padding: 24px 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #000; }
        .toolbar { max-width: 210mm; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .toolbar button { border: 2px solid #000; background: #F2556E; color: #fff; font-weight: 700; text-transform: uppercase; padding: 8px 14px; border-radius: 4px; cursor: pointer; }
        .sheet { background: #fff; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 16mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); box-sizing: border-box; }
        .meta { display: grid; grid-template-columns: auto 1fr; gap: 2px 14px; font-size: 11px; font-family: ui-monospace, monospace; margin-bottom: 14px; }
        .meta dt { text-transform: uppercase; letter-spacing: .08em; color: #555; }
        h1 { font-size: 20px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: -.01em; }
        table { width: 100%; border-collapse: collapse; font-size: 11.5px; font-family: ui-monospace, Menlo, monospace; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .1em; border: 1.5px solid #000; padding: 5px 7px; background: #000; color: #fff; }
        td { border: 1.5px solid #000; padding: 7px; vertical-align: top; white-space: pre-wrap; line-height: 1.45; }
        td.num { text-align: center; font-weight: 700; width: 28px; }
        td .shot { font-weight: 700; text-transform: uppercase; font-size: 10px; color: #444; display: block; margin-bottom: 2px; }
        td .super { font-size: 10px; text-transform: uppercase; color: #444; display: block; margin-top: 4px; }
        td .dur { font-size: 10px; color: #555; display: block; margin-top: 3px; font-weight: 400; }
        tfoot td { font-weight: 700; background: #F8F1E8; }
        tr { break-inside: avoid; }
        @media print { .print-root { background: #fff; padding: 0; } .toolbar { display: none; } .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; } }
      `}</style>
      <div className="toolbar">
        <span>Use your browser's print dialog and choose <b>Save as PDF</b>.</span>
        <button type="button" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
      <section className="sheet">
        <h1>{script.title}</h1>
        <dl className="meta">
          <dt>Project</dt><dd>{script.project_title || "—"}{script.project_type ? ` (${script.project_type})` : ""}</dd>
          <dt>Round</dt><dd>{version ? `${version.version_number}${version.notes ? ` · ${version.notes}` : ""}` : "—"}</dd>
          <dt>Date</dt><dd>{version?.updated_at ? new Date(version.updated_at).toLocaleDateString() : ""}</dd>
          <dt>Writer</dt><dd>{script.author_name || "—"}</dd>
          <dt>Running time</dt><dd>{formatSeconds(total)} ({rows.length} rows)</dd>
          <dt>Status</dt><dd>{status.status === "unshared" ? "Not yet shared" : status.status === "approved" ? `Approved by ${status.by}` : status.status === "changes_requested" ? `Changes requested by ${status.by}` : "Awaiting client review"}</dd>
        </dl>
        <table>
          <thead>
            <tr><th style={{ width: 28 }}>#</th><th style={{ width: "48%" }}>Video</th><th>Audio</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="num">{row.position}{row.duration_seconds !== null && <span className="dur">{row.duration_seconds}s</span>}</td>
                <td>{row.shot && <span className="shot">{row.shot}</span>}{row.video}{row.super_text && <span className="super">SUPER: {row.super_text}</span>}</td>
                <td>{row.audio}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td className="num">{formatSeconds(total)}</td><td colSpan={2}>Total running time</td></tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
};

export default AvPrintPage;
