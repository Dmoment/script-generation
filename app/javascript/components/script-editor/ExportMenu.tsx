import React, { useEffect, useRef, useState } from "react";
import { colors } from "../../lib/theme";
import { downloadVersionExport, type ExportFormat } from "../../lib/downloadExport";
import { useImportScriptMutation } from "../../queries/scripts/useImportScriptMutation";

interface ExportMenuProps {
  scriptId: string | number;
  scriptVersionId: number;
}

/**
 * Export (Final Draft, Fountain, print/PDF) and import for the open version.
 */
const ExportMenu: React.FC<ExportMenuProps> = ({ scriptId, scriptVersionId }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportScriptMutation();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const exportAs = async (format: ExportFormat) => {
    setBusy(format);
    setOpen(false);
    try {
      await downloadVersionExport(scriptVersionId, format);
      setNotice({ kind: "ok", text: format === "fdx" ? "Final Draft file downloaded" : "Fountain file downloaded" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Export failed" });
    } finally {
      setBusy(null);
    }
  };

  const openPrintView = () => {
    setOpen(false);
    window.open(`/scripts/${scriptId}/versions/${scriptVersionId}/print`, "_blank", "noopener");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const confirmed = window.confirm(
      `Replace every scene in this version with the contents of "${file.name}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;
    setBusy("import");
    try {
      const result = await importMutation.mutateAsync({ scriptVersionId, file });
      setNotice({ kind: "ok", text: `Imported ${result.scenes_count} scenes from ${file.name}` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Import failed" });
    } finally {
      setBusy(null);
    }
  };

  const itemClass = "w-full text-left px-4 py-2 text-sm font-bold uppercase hover:bg-gray-100 flex items-center justify-between gap-4 disabled:opacity-50";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase transition-colors bg-white text-black hover:bg-gray-100 flex items-center gap-2 disabled:opacity-60"
        title="Export or import this version"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {busy ? "Working…" : "Export"}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white border-2 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-30 py-1"
        >
          <div className="px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">Download</div>
          <button type="button" role="menuitem" className={itemClass} onClick={() => exportAs("fdx")}>
            Final Draft <span className="font-mono font-normal text-gray-500 normal-case">.fdx</span>
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => exportAs("fountain")}>
            Fountain <span className="font-mono font-normal text-gray-500 normal-case">.fountain</span>
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={openPrintView}>
            Print / PDF <span className="font-mono font-normal text-gray-500 normal-case">new tab</span>
          </button>
          <div className="border-t-2 border-black my-1" />
          <div className="px-4 pt-1 pb-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">Replace scenes</div>
          <button type="button" role="menuitem" className={itemClass} onClick={() => { setOpen(false); fileInputRef.current?.click(); }}>
            Import file <span className="font-mono font-normal text-gray-500 normal-case">.fdx .fountain .txt</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".fdx,.fountain,.txt,application/xml,text/plain"
        className="hidden"
        onChange={handleImportFile}
        aria-label="Import screenplay file"
      />

      {notice && (
        <div
          role="status"
          className="absolute right-0 mt-2 w-72 px-3 py-2 text-xs font-mono border-2 border-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] z-30"
          style={{ color: notice.kind === "error" ? colors.status.red : colors.text.black }}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
