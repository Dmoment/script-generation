import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";
import { useScriptQuery } from "../queries/scripts/useScriptQuery";
import ScriptEditorPage from "../pages/ScriptEditorPage";
import AvScriptEditorPage from "../pages/AvScriptEditorPage";
import ScriptPrintPage from "../pages/ScriptPrintPage";
import AvPrintPage from "../pages/AvPrintPage";

/**
 * Opens the right editor (or print view) for a script's format: the
 * screenplay editor for scene-based scripts, the two-column editor for AV
 * scripts.
 */
const EditorRoute: React.FC<{ view: "editor" | "print" }> = ({ view }) => {
  const { scriptId, versionId } = useParams<{ scriptId: string; versionId: string }>();
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const id = scriptId ? parseInt(scriptId, 10) : 0;
  const scriptVersionId = versionId ? parseInt(versionId, 10) : 0;
  const { data: script, isLoading: scriptLoading, error } = useScriptQuery({ scriptId: id, enabled: isAuthenticated });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: `/scripts/${scriptId}/versions/${versionId}${view === "print" ? "/print" : ""}` } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, scriptId, versionId, view]);

  if (isLoading || !isAuthenticated || (scriptLoading && !script)) return <LoadingScreen />;
  if (error || !script) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-gray-600">
        {error ? error.message : "Script not found"}
      </div>
    );
  }

  if (script.script_type === "av_script") {
    return view === "print" ? <AvPrintPage script={script} scriptVersionId={scriptVersionId} /> : <AvScriptEditorPage script={script} scriptVersionId={scriptVersionId} />;
  }
  return view === "print" ? <ScriptPrintPage /> : <ScriptEditorPage />;
};

export default EditorRoute;
