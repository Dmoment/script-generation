import React, { useState, useMemo } from "react";
import IndexCardFilters from "./IndexCardFilters";
import IndexCard, { SceneCard } from "./IndexCard";

interface IndexCardViewProps {
  scenes: SceneCard[];
  onSceneReorder?: (newOrder: SceneCard[]) => void;
  groupingMode: "none" | "act" | "location" | "thread";
  onGroupingModeChange: (mode: "none" | "act" | "location" | "thread") => void;
}

const IndexCardView: React.FC<IndexCardViewProps> = ({
  scenes,
  onSceneReorder,
  groupingMode,
  onGroupingModeChange,
}) => {
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
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
          </div>
          <div className="text-xs text-gray-600 font-mono">
            {filteredScenes.length} scene{filteredScenes.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Cards Grid */}
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
                  <IndexCard
                    key={scene.id}
                    scene={scene}
                    isExpanded={expandedCardId === scene.id}
                    onExpand={handleCardExpand}
                    onCollapse={handleCardCollapse}
                    actColor={getActColor(scene.act)}
                  />
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
      </div>
    </div>
  );
};

export default IndexCardView;

