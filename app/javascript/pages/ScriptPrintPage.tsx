import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from '../hooks/useAuth';
import LoadingScreen from "../components/LoadingScreen";
import { useScenesQuery } from "../queries/scenes/useScenesQuery";
import { useScriptQuery } from "../queries/scripts/useScriptQuery";
import { useRevisionsQuery, revisionHex } from "../queries/versions/useVersionQueries";
import type { Scene, ScreenplayElement, ScreenplayElementType } from "../types/api";
import { cueText } from "../lib/screenplay-editor";

/**
 * Print view: the whole version laid out as US-letter screenplay pages.
 * The browser's print dialog produces the PDF (File > Print > Save as PDF).
 */
const ScriptPrintPage: React.FC = () => {
  const { scriptId, versionId } = useParams<{ scriptId: string; versionId: string }>();
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const scriptVersionId = versionId ? parseInt(versionId, 10) : 0;

  const { data: scenes = [], isLoading: scenesLoading } = useScenesQuery({ scriptVersionId, enabled: isAuthenticated });
  const { data: script } = useScriptQuery({ scriptId: scriptId ? parseInt(scriptId, 10) : 0, enabled: isAuthenticated });
  const { data: revisions } = useRevisionsQuery(scriptVersionId, isAuthenticated);
  const revised = useMemo(() => new Set(revisions?.changed_scene_ids || []), [revisions]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: `/scripts/${scriptId}/versions/${versionId}/print` } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, scriptId, versionId]);

  const ordered = useMemo(
    () => [...scenes].sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number)),
    [scenes]
  );

  const version = script?.script_versions?.find((v) => v.id === scriptVersionId);

  useEffect(() => {
    document.title = script ? `${script.title} – print` : "Print script";
  }, [script]);

  if (isLoading || scenesLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return (
    <div className="print-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        @page { size: letter; margin: 1in 1in 1in 1.5in; @top-right { content: counter(page) "."; font-family: "Courier Prime", Courier, monospace; font-size: 12pt; } }
        .print-root { background: #e5e7eb; min-height: 100vh; padding: 24px 0; font-family: "Courier Prime", Courier, "Courier New", monospace; font-size: 12pt; line-height: 1; color: #000; }
        .print-toolbar { max-width: 8.5in; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; }
        .print-toolbar button { border: 2px solid #000; background: #F2556E; color: #fff; font-weight: 700; text-transform: uppercase; padding: 8px 14px; border-radius: 4px; cursor: pointer; }
        .sheet { background: #fff; width: 8.5in; min-height: 11in; margin: 0 auto 24px; padding: 1in 1in 1in 1.5in; box-shadow: 0 2px 12px rgba(0,0,0,.18); box-sizing: border-box; }
        .title-page { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .title-page h1 { font-size: 12pt; font-weight: 400; text-transform: uppercase; text-decoration: underline; margin: 0 0 2em; }
        .title-page p { margin: 0 0 1em; }
        .el { white-space: pre-wrap; margin: 0; line-height: 1; }
        .el + .el { margin-top: 1em; }
        .el.slugline { text-transform: uppercase; break-after: avoid; position: relative; }
        .rev-mark { position: absolute; right: -0.6in; top: 0; font-weight: 700; }
        .el.character { margin-left: 2.2in; text-transform: uppercase; break-after: avoid; }
        .el.parenthetical { margin-left: 1.6in; width: 2.6in; margin-top: 0; }
        .el.dialogue { margin-left: 1in; width: 3.5in; margin-top: 0; }
        .el.transition { text-align: right; text-transform: uppercase; }
        .el.centered { text-align: center; }
        .dialogue-block { break-inside: avoid; }
        .dialogue-block + .el, .el + .dialogue-block, .dialogue-block + .dialogue-block { margin-top: 1em; }
        .page-break { break-after: page; }
        @media print {
          .print-root { background: #fff; padding: 0; }
          .print-toolbar { display: none; }
          .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
          .sheet.title-page { height: 9in; break-after: page; }
        }
      `}</style>

      <div className="print-toolbar">
        <span>
          Use your browser's print dialog and choose <b>Save as PDF</b>. Pages are US letter with industry margins.
        </span>
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <section className="sheet title-page">
        <h1>{script?.title || "Untitled"}</h1>
        {script?.description && <p>{script.description}</p>}
        <p>Written by</p>
        <p>{script?.author_name || ""}</p>
        <p style={{ marginTop: "4em" }}>
          {version ? `Draft ${version.version_number}` : ""}
          {version?.updated_at ? ` · ${new Date(version.updated_at).toLocaleDateString()}` : ""}
        </p>
        {version?.revision_color && (
          <p style={{ marginTop: "1em" }}>
            <span style={{ display: "inline-block", padding: "2px 10px", border: "1px solid #000", backgroundColor: revisionHex(version.revision_color), textTransform: "uppercase" }}>
              {version.revision_color_label} revision{version.revision_date ? ` · ${new Date(version.revision_date).toLocaleDateString()}` : ""}
            </span>
          </p>
        )}
        {revisions?.previous_version && (
          <p style={{ marginTop: "2em", fontSize: "10pt" }}>* marks scenes revised since draft {revisions.previous_version.version_number}</p>
        )}
      </section>

      <section className="sheet">
        {ordered.map((scene) => renderScene(scene, revised.has(scene.id)))}
      </section>
    </div>
  );
};

function renderScene(scene: Scene, revisedScene = false): React.ReactNode {
  if (scene.omitted) {
    return (
      <p className="el slugline" key={scene.id}>
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{scene.scene_label || scene.scene_number} OMITTED</span>
          <span aria-label="scene number">{scene.scene_label || scene.scene_number}</span>
        </span>
      </p>
    );
  }
  const elements: ScreenplayElement[] = Array.isArray(scene.elements) ? scene.elements : [];
  const blocks = elements.some((el) => el.type === "slugline") || !scene.slugline
    ? elements
    : [{ type: "slugline" as ScreenplayElementType, text: scene.slugline }, ...elements];

  // Group a cue with its parenthetical/dialogue so a page break never splits them.
  const groups: Array<ScreenplayElement[] | ScreenplayElement> = [];
  blocks.forEach((el) => {
    const last = groups[groups.length - 1];
    if ((el.type === "parenthetical" || el.type === "dialogue") && Array.isArray(last)) {
      last.push(el);
    } else if (el.type === "character") {
      groups.push([el]);
    } else {
      groups.push(el);
    }
  });

  return (
    <React.Fragment key={scene.id}>
      {groups.map((group, i) =>
        Array.isArray(group) ? (
          <div className="dialogue-block" key={`${scene.id}-${i}`}>
            {group.map((el, j) => renderElement(el, `${scene.id}-${i}-${j}`, scene.scene_label || String(scene.scene_number), revisedScene))}
          </div>
        ) : (
          renderElement(group, `${scene.id}-${i}`, scene.scene_label || String(scene.scene_number), revisedScene)
        )
      )}
    </React.Fragment>
  );
}

function renderElement(el: ScreenplayElement, key: string, sceneNumber: string, revisedScene = false): React.ReactNode {
  if (el.type === "page_break") return <div className="page-break" key={key} />;
  if (!el.text?.trim()) return null;
  const text = el.type === "character" ? cueText(el) : el.text;
  return (
    <p className={`el ${el.type}`} key={key}>
      {el.type === "slugline" ? (
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{text}</span>
          <span aria-label="scene number">{sceneNumber}</span>
          {revisedScene && <span className="rev-mark" aria-label="revised">*</span>}
        </span>
      ) : (
        text
      )}
    </p>
  );
}

export default ScriptPrintPage;
