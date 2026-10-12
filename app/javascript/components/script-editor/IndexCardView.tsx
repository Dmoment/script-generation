import React, { useState, useMemo } from "react";
import IndexCardFilters from "./IndexCardFilters";
import IndexCard, { SceneCard } from "./IndexCard";
import CorkboardView from "./CorkboardView";
import { colors } from "../../lib/theme";

type ViewMode = "grid" | "corkboard";

interface IndexCardViewProps {
  scenes: SceneCard[];
  onSceneReorder?: (newOrder: SceneCard[]) => void;
  onCardPositionChange?: (sceneId: number, x: number, y: number) => void;
  groupingMode: "none" | "act" | "location" | "thread";
  onGroupingModeChange: (mode: "none" | "act" | "location" | "thread") => void;
}

const IndexCardView: React.FC<IndexCardViewProps> = ({
  scenes,
  onSceneReorder,
  onCardPositionChange,
  groupingMode,
  onGroupingModeChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const draggedIdRef = React.useRef<number | null>(null);
  const [filters, setFilters] = useState({
    act: null as string | null,
    location: null as string | null,
    character: null as string | null,
    tone: null as string | null,
    status: null as string | null,
  });

  const availableActs = useMemo(
    () => Array.from(new Set(scenes.map((s) => s.act).filter((act): act is string => Boolean(act)))),
    [scenes]
  );

  const availableLocations = useMemo(
    () => Array.from(new Set(scenes.map((s) => s.location).filter((loc): loc is string => Boolean(loc)))),
    [scenes]
  );

  const availableCharacters = useMemo(() => {
    const allChars = scenes.flatMap((s) => s.characters);
    return Array.from(new Set(allChars));
  }, [scenes]);

  const availableTones = useMemo(
    () => Array.from(new Set(scenes.map((s) => s.tone).filter((tone): tone is string => Boolean(tone)))),
    [scenes]
  );

  const availableStatuses = useMemo(
    () => Array.from(new Set(scenes.map((s) => s.status).filter((status): status is string => Boolean(status)))),
    [scenes]
  );

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      if (filters.act && scene.act !== filters.act) return false;
      if (filters.location && scene.location !== filters.location) return false;
      if (filters.character && !scene.characters.includes(filters.character))
        return false;
      if (filters.tone && scene.tone !== filters.tone) return false;
      if (filters.status && scene.status !== filters.status) return false;
      return true;
    });
  }, [scenes, filters]);

  const groupedScenes = useMemo(() => {
    if (groupingMode === "none") {
      return { "All Scenes": filteredScenes };
    }

    const groups: Record<string, SceneCard[]> = {};
    filteredScenes.forEach((scene) => {
      let key = "Uncategorized";
      if (groupingMode === "act" && scene.act) {
        key = scene.act;
      } else if (groupingMode === "location" && scene.location) {
        key = scene.location;
      } else if (groupingMode === "thread") {
        key = scene.characters.join(", ") || "Uncategorized";
      }
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(scene);
    });
    return groups;
  }, [filteredScenes, groupingMode]);

  const handleFilterChange = (filterType: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleCardExpand = (sceneId: number) => {
    setExpandedCardId(sceneId);
  };

  const handleCardCollapse = () => {
    setExpandedCardId(null);
  };

  const getActColor = (act: string | undefined): string => {
    const actColors: Record<string, string> = {
      "ACT 1": "#3B82F6", // Blue
      "ACT 2": "#F59E0B", // Orange
      "ACT 3": "#EF4444", // Red
    };
    return actColors[act?.toUpperCase() || ""] || colors.primary.pink;
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    sceneId: number
  ) => {
    draggedIdRef.current = sceneId;
    e.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set to initiate drag.
    e.dataTransfer.setData("text/plain", String(sceneId));
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    sceneId: number
  ) => {
    if (draggedIdRef.current == null || draggedIdRef.current === sceneId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(sceneId);
  };

  const handleDragLeave = (sceneId: number) => {
    setDragOverId((prev) => (prev === sceneId ? null : prev));
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetSceneId: number
  ) => {
    e.preventDefault();
    const sourceId = draggedIdRef.current;
    draggedIdRef.current = null;
    setDragOverId(null);
    if (sourceId == null || sourceId === targetSceneId) return;

    const sourceIndex = scenes.findIndex((s) => s.id === sourceId);
    const targetIndex = scenes.findIndex((s) => s.id === targetSceneId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...scenes];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onSceneReorder?.(next);
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    setDragOverId(null);
  };

  const showCorkboard = viewMode === "corkboard";

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* Filters Sidebar */}
      <IndexCardFilters
        isCollapsed={isFiltersCollapsed}
        onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
        filters={filters}
        onFilterChange={handleFilterChange}
        availableActs={availableActs}
        availableLocations={availableLocations}
        availableCharacters={availableCharacters}
        availableTones={availableTones}
        availableStatuses={availableStatuses}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b-2 border-black px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black uppercase text-black tracking-tight">
              Index Cards
            </h2>
            {/* View Mode Toggle */}
            <div className="flex border-2 border-black rounded overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                  viewMode === "grid"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
                title="Grid view with drag-to-reorder"
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("corkboard")}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-l-2 border-black ${
                  viewMode === "corkboard"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
                title="Freeform corkboard: pan, zoom, place cards anywhere"
              >
                Corkboard
              </button>
            </div>
            {!showCorkboard && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-600 font-mono">
                  Group by:
                </span>
                <select
                  value={groupingMode}
                  onChange={(e) =>
                    onGroupingModeChange(
                      e.target.value as "none" | "act" | "location" | "thread"
                    )
                  }
                  className="px-3 py-1.5 border-2 border-black rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="none">None</option>
                  <option value="act">Act</option>
                  <option value="location">Location</option>
                  <option value="thread">Thread</option>
                </select>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600 font-mono">
            {filteredScenes.length} scene{filteredScenes.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Body */}
        {showCorkboard ? (
          <CorkboardView
            scenes={filteredScenes}
            onCardPositionChange={(id, x, y) =>
              onCardPositionChange?.(id, x, y)
            }
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {Object.entries(groupedScenes).map(([groupName, groupScenes]) => (
              <div key={groupName} className="mb-8">
                {groupingMode !== "none" && (
                  <h3 className="text-sm font-black uppercase text-black mb-4 font-mono">
                    {groupName}
                  </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupScenes.map((scene) => (
                    <div
                      key={scene.id}
                      draggable={!!onSceneReorder}
                      onDragStart={(e) => handleDragStart(e, scene.id)}
                      onDragOver={(e) => handleDragOver(e, scene.id)}
                      onDragLeave={() => handleDragLeave(scene.id)}
                      onDrop={(e) => handleDrop(e, scene.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition-transform ${
                        dragOverId === scene.id
                          ? "ring-4 ring-pink-400 rounded-lg"
                          : ""
                      }`}
                      style={{
                        opacity:
                          draggedIdRef.current === scene.id ? 0.4 : 1,
                      }}
                    >
                      <IndexCard
                        scene={scene}
                        isExpanded={expandedCardId === scene.id}
                        onExpand={handleCardExpand}
                        onCollapse={handleCardCollapse}
                        actColor={getActColor(scene.act)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredScenes.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 font-mono">
                  No scenes match the current filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexCardView;
