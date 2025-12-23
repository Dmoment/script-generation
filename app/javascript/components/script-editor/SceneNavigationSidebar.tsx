import React from "react";
import { colors } from "../../lib/theme";
import type { Scene } from "../../types/api";

interface SceneNavigationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedScene: number;
  onSceneSelect: (sceneNumber: number) => void;
  sceneNumber: string;
  onSceneNumberChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  scenes?: Scene[];
}

const SceneNavigationSidebar: React.FC<SceneNavigationSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  selectedScene,
  onSceneSelect,
  sceneNumber,
  onSceneNumberChange,
  filterValue,
  onFilterChange,
  scenes = [],
}) => {
  const filteredScenes = scenes.filter((scene) => {
    const searchText = filterValue.toLowerCase();
    return (
      scene.slugline?.toLowerCase().includes(searchText) ||
      scene.content?.toLowerCase().includes(searchText) ||
      scene.scene_number.toString().includes(searchText)
    );
  });

  const sortedScenes = [...filteredScenes].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.scene_number - b.scene_number;
  });

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r-2 border-black flex flex-col items-center py-4 shadow-[2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Expand sidebar"
        >
          <svg
            className="w-5 h-5 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r-2 border-black flex flex-col shadow-[2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
      <div className="p-4 border-b-2 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-black uppercase text-black tracking-tight">
            Script
          </h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg
            className="w-4 h-4 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
      <div className="p-4 border-b-2 border-black">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase text-black mb-1 font-mono">
              Scene number
            </label>
            <input
              type="text"
              value={sceneNumber}
              onChange={(e) => onSceneNumberChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              style={{ fontFamily: 'Courier, "Courier New", monospace' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-black mb-1 font-mono">
              Name Filter
            </label>
            <input
              type="text"
              placeholder="Filter scenes..."
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              style={{ fontFamily: 'Courier, "Courier New", monospace' }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {sortedScenes.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-500 font-mono">
              {scenes.length === 0 ? "No scenes yet" : "No scenes match filter"}
            </div>
          ) : (
            sortedScenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => onSceneSelect(scene.scene_number)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors border-2 ${
                  selectedScene === scene.scene_number
                    ? "text-white border-black font-bold"
                    : "border-transparent hover:border-gray-300 text-gray-700"
                }`}
                style={
                  selectedScene === scene.scene_number
                    ? { backgroundColor: colors.primary.pink }
                    : {}
                }
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-mono truncate" style={{ fontFamily: 'Courier, "Courier New", monospace' }}>
                  {scene.scene_number}. {scene.slugline || "Untitled Scene"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneNavigationSidebar;

