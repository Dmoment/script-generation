import React, { useState } from "react";
import { colors } from "../../lib/theme";
import type { ScriptVersion } from "../../types/api";
import { REVISION_COLORS, revisionHex, useLockNumbersMutation, useUpdateVersionMutation } from "../../queries/versions/useVersionQueries";

interface RevisionBarProps {
  version: ScriptVersion | undefined;
}

/**
 * Production revision controls for the open draft: lock scene numbers
 * (so inserts become A-scenes and cuts become OMITTED) and set the
 * revision colour and date that go on the title page.
 */
const RevisionBar: React.FC<RevisionBarProps> = ({ version }) => {
  const lock = useLockNumbersMutation();
  const update = useUpdateVersionMutation();
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  if (!version) return null;

  const locked = !!version.scene_numbers_locked_at;
  const color = version.revision_color || "";

  const toggleLock = async () => {
    if (locked && !confirmUnlock) {
      setConfirmUnlock(true);
      return;
    }
    setConfirmUnlock(false);
    await lock.mutateAsync({ versionId: version.id, locked: !locked });
  };

  return (
    <div className="px-6 py-1.5 border-b-2 border-black bg-white flex items-center gap-4 text-xs font-mono flex-wrap">
      <span className="uppercase font-bold text-gray-700">Revision</span>
      <button
        type="button"
        onClick={toggleLock}
        disabled={lock.isPending}
        className="px-2 py-0.5 border-2 border-black uppercase font-bold hover:bg-gray-100 disabled:opacity-50"
        style={locked ? { backgroundColor: colors.text.black, color: "white" } : { backgroundColor: "white" }}
        title={locked ? "Scene numbers are locked: inserts get letters, cuts become OMITTED" : "Lock scene numbers before distributing to production"}
      >
        {locked ? (confirmUnlock ? "Unlock and renumber?" : "Numbers locked") : "Lock numbers"}
      </button>
      {confirmUnlock && (
        <button type="button" onClick={() => setConfirmUnlock(false)} className="uppercase font-bold text-gray-500 hover:text-black">cancel</button>
      )}

      <label className="flex items-center gap-1">
        <span className="uppercase text-gray-600">Colour</span>
        <select
          value={color}
          onChange={(e) => update.mutate({ versionId: version.id, revision_color: e.target.value })}
          className="border-2 border-black px-1 py-0.5 uppercase font-bold"
          style={{ backgroundColor: revisionHex(color) }}
          aria-label="Revision colour"
        >
          <option value="">—</option>
          {REVISION_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          {REVISION_COLORS.map((c) => (
            <option key={`double ${c}`} value={`double ${c}`}>double {c}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1">
        <span className="uppercase text-gray-600">Dated</span>
        <input
          type="date"
          value={version.revision_date || ""}
          onChange={(e) => update.mutate({ versionId: version.id, revision_date: e.target.value })}
          className="border-2 border-black px-1 py-0.5"
          aria-label="Revision date"
        />
      </label>

      {locked && <span className="text-gray-500">Inserted scenes get letters (12A); cut scenes stay as OMITTED</span>}
    </div>
  );
};

export default RevisionBar;
