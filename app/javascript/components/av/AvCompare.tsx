import React from "react";

export interface AvDiffRow {
  status: "changed" | "added" | "removed" | "unchanged";
  position: number;
  base_row_id: number | null;
  target_row_id: number | null;
  changed_fields: string[];
  base: Record<string, string | number | null> | null;
  target: Record<string, string | number | null> | null;
}

const STATUS: Record<AvDiffRow["status"], { label: string; color: string }> = {
  changed: { label: "Revised", color: "#2A4DD0" },
  added: { label: "New", color: "#16A34A" },
  removed: { label: "Removed", color: "#DC2626" },
  unchanged: { label: "Unchanged", color: "#9CA3AF" },
};

const FIELD_LABEL: Record<string, string> = { shot: "Shot", video: "Video", audio: "Audio", super_text: "Super", duration_seconds: "Duration", notes: "Notes" };

/** Round-to-round differences of an AV script, one card per row. */
const AvCompare: React.FC<{ rows: AvDiffRow[] }> = ({ rows }) => (
  <>
    {rows.map((row) => {
      const style = STATUS[row.status];
      const fields = row.status === "unchanged" ? [] : row.status === "changed" ? row.changed_fields : ["shot", "video", "audio", "super_text", "duration_seconds"];
      return (
        <section key={`${row.status}-${row.target_row_id ?? row.base_row_id}`} className="bg-white border-2 border-black mb-4">
          <header className="px-4 py-2 border-b-2 border-black flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: style.color }}>{style.label}</span>
            <span className="font-bold uppercase">Row {row.position}</span>
            {row.status === "changed" && <span className="text-xs text-gray-500">{row.changed_fields.map((f) => FIELD_LABEL[f] || f).join(", ")}</span>}
          </header>
          {fields.length > 0 && (
            <div className="px-4 py-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
              {fields.map((f) => {
                const before = row.base?.[f];
                const after = row.target?.[f];
                return (
                  <React.Fragment key={f}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-1">{FIELD_LABEL[f] || f}</div>
                    <div className="whitespace-pre-wrap">
                      {row.status !== "added" && before !== null && before !== undefined && String(before) !== "" && (
                        <div className="px-1 -mx-1 line-through" style={{ backgroundColor: "#FEE2E2" }}>− {String(before)}</div>
                      )}
                      {row.status !== "removed" && after !== null && after !== undefined && String(after) !== "" && (
                        <div className="px-1 -mx-1" style={{ backgroundColor: "#DCFCE7" }}>+ {String(after)}</div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </section>
      );
    })}
  </>
);

export default AvCompare;
