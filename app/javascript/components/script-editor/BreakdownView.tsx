import React, { useMemo, useState } from "react";
import { colors } from "../../lib/theme";
import { useBreakdownQuery } from "../../queries/versions/useVersionQueries";
import { getAuthToken } from "../../lib/authTokenProvider";
import { BREAKDOWN_CATEGORIES } from "./SceneMetadataSidebar";

interface BreakdownViewProps {
  scriptVersionId: number;
  onOpenScene: (sceneId: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(BREAKDOWN_CATEGORIES.map((c) => [c.key, c.color]));
CATEGORY_COLORS.cast = "#8B5CF6";

/** Production breakdown: every tagged item by category, and which scenes need it. */
const BreakdownView: React.FC<BreakdownViewProps> = ({ scriptVersionId, onOpenScene }) => {
  const { data, isLoading, error } = useBreakdownQuery(scriptVersionId);
  const [mode, setMode] = useState<"by_item" | "by_scene">("by_item");
  const [downloading, setDownloading] = useState(false);

  const nonEmpty = useMemo(() => (data?.categories || []).filter((c) => c.items.length > 0), [data]);
  const totalItems = nonEmpty.reduce((sum, c) => sum + c.items.length, 0);
  const sceneById = useMemo(() => new Map((data?.scenes || []).map((s) => [s.scene_number, s.scene_id])), [data]);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/v1/script_versions/${scriptVersionId}/breakdown?file_format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] || "breakdown.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: colors.background.beigeAlt }}>
      <div className="px-8 py-4 bg-white border-b-2 border-black flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight">Breakdown</h2>
          <p className="text-xs font-mono text-gray-600">
            {data ? `${totalItems} items across ${data.scenes.length} scenes` : "Loading…"} · tag items per scene in the scene details panel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border-2 border-black rounded overflow-hidden text-xs font-bold uppercase">
            <button type="button" onClick={() => setMode("by_item")} className={`px-3 py-1.5 ${mode === "by_item" ? "text-white" : "bg-white"}`} style={mode === "by_item" ? { backgroundColor: colors.primary.pink } : undefined}>By item</button>
            <button type="button" onClick={() => setMode("by_scene")} className={`px-3 py-1.5 border-l-2 border-black ${mode === "by_scene" ? "text-white" : "bg-white"}`} style={mode === "by_scene" ? { backgroundColor: colors.primary.pink } : undefined}>By scene</button>
          </div>
          <button type="button" onClick={downloadCsv} disabled={downloading || !data} className="px-3 py-1.5 border-2 border-black rounded text-xs font-bold uppercase bg-white hover:bg-gray-100 disabled:opacity-50">
            {downloading ? "Preparing…" : "Download CSV"}
          </button>
        </div>
      </div>

      {error && <p className="p-8 font-mono text-sm" style={{ color: colors.status.red }}>Could not load the breakdown: {error.message}</p>}
      {isLoading && <p className="p-8 font-mono text-sm text-gray-500">Loading breakdown…</p>}

      {data && mode === "by_item" && (
        <div className="p-8 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {nonEmpty.length === 0 && (
            <p className="font-mono text-sm text-gray-600 col-span-full">Nothing tagged yet. Open a scene, expand a category in the right panel and add items.</p>
          )}
          {nonEmpty.map((category) => (
            <section key={category.key} className="bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <header className="px-4 py-2 border-b-2 border-black flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category.key] || "#9CA3AF" }} aria-hidden="true" />
                <h3 className="text-sm font-black uppercase flex-1">{category.label}</h3>
                <span className="text-xs font-mono text-gray-500">{category.items.length}</span>
              </header>
              <ul className="divide-y divide-gray-200">
                {category.items.map((item) => (
                  <li key={item.name} className="px-4 py-2 flex items-start gap-3">
                    <span className={`text-sm flex-1 ${category.key === "cast" ? "font-mono uppercase" : ""}`}>{item.name}</span>
                    <span className="flex flex-wrap gap-1 justify-end">
                      {item.scene_numbers.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            const id = sceneById.get(n);
                            if (id) onOpenScene(id);
                          }}
                          className="min-w-[1.6rem] px-1 text-[11px] font-mono border border-black rounded-sm hover:text-white tabular-nums"
                          style={{ backgroundColor: "white" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primary.pink)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                          title={`Open scene ${n}`}
                        >
                          {n}
                        </button>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {data && mode === "by_scene" && (
        <div className="p-8 overflow-x-auto">
          <table className="w-full bg-white border-2 border-black text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-mono">Scene</th>
                {["cast", ...BREAKDOWN_CATEGORIES.map((c) => c.key)].map((key) => (
                  <th key={key} className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-mono whitespace-nowrap">
                    {key === "cast" ? "Cast" : BREAKDOWN_CATEGORIES.find((c) => c.key === key)?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.scenes.map((scene) => (
                <tr key={scene.scene_id} className="border-b border-gray-200 align-top hover:bg-gray-50 cursor-pointer" onClick={() => onOpenScene(scene.scene_id)}>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">
                    <span className="font-bold">{scene.scene_number}</span> <span className="uppercase text-xs">{scene.slugline || "(no heading)"}</span>
                  </td>
                  {["cast", ...BREAKDOWN_CATEGORIES.map((c) => c.key)].map((key) => (
                    <td key={key} className="px-3 py-2 text-xs">
                      {(scene.items[key] || []).length === 0 ? <span className="text-gray-300">—</span> : (scene.items[key] || []).join(", ")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BreakdownView;
