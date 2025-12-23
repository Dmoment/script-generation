import React from "react";

interface SceneMetadataSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedScene: number;
  totalScenes: number;
}

interface Category {
  name: string;
  color: string;
  count: number | null;
}

const SceneMetadataSidebar: React.FC<SceneMetadataSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  selectedScene,
  totalScenes,
}) => {
  const categories: Category[] = [
    { name: "General information", color: "blue", count: null },
    { name: "Scene notes", color: "gray", count: null },
    { name: "Cast members", color: "purple", count: 2 },
    { name: "Props", color: "brown", count: 5 },
    { name: "Customes", color: "orange", count: 5 },
    { name: "Makeup", color: "pink", count: null },
    { name: "Vehicles", color: "teal", count: null },
    { name: "Stuns", color: "red", count: null },
    { name: "SPFX", color: "green", count: null },
    { name: "Music", color: "light-green", count: null },
  ];

  const getColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      brown: "bg-amber-700",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      teal: "bg-teal-500",
      red: "bg-red-500",
      green: "bg-green-500",
      "light-green": "bg-green-400",
      gray: "bg-gray-400",
    };
    return colorMap[color] || "bg-gray-400";
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l-2 border-black flex flex-col items-center py-4 shadow-[-2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l-2 border-black overflow-y-auto shadow-[-2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
      <div className="p-4 border-b-2 border-black flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-black tracking-tight">
          {selectedScene} / {totalScenes} Scene
        </h3>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.name}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-left border-2 border-transparent hover:border-gray-200"
            >
              <div
                className={`w-2 h-2 rounded-full ${getColorClass(category.color)}`}
              ></div>
              <span className="text-sm text-black font-medium flex-1">
                {category.name}
                {category.count !== null && (
                  <span className="text-gray-600 ml-1 font-normal">
                    ({category.count})
                  </span>
                )}
              </span>
              <svg
                className="w-4 h-4 text-gray-400"
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default SceneMetadataSidebar;

