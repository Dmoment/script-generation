import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../lib/theme";

interface ScriptEditorHeaderProps {
  activeTab: "scenes" | "script" | "characters" | "outline";
  onTabChange: (tab: "scenes" | "script" | "characters" | "outline") => void;
}

const ScriptEditorHeader: React.FC<ScriptEditorHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b-2 border-black px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <button
          onClick={() => onTabChange("scenes")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border-2 font-bold uppercase text-sm ${
            activeTab === "scenes"
              ? "text-white border-black"
              : "text-gray-700 border-gray-300 hover:border-gray-400 bg-white"
          }`}
          style={
            activeTab === "scenes"
              ? { backgroundColor: colors.primary.pink }
              : {}
          }
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Scenes
        </button>
        <button
          onClick={() => onTabChange("script")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border-2 font-bold uppercase text-sm ${
            activeTab === "script"
              ? "text-white border-black"
              : "text-gray-700 border-gray-300 hover:border-gray-400 bg-white"
          }`}
          style={
            activeTab === "script"
              ? { backgroundColor: colors.primary.pink }
              : {}
          }
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          Script
        </button>
        <button
          onClick={() => onTabChange("characters")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border-2 font-bold uppercase text-sm ${
            activeTab === "characters"
              ? "text-white border-black"
              : "text-gray-700 border-gray-300 hover:border-gray-400 bg-white"
          }`}
          style={
            activeTab === "characters"
              ? { backgroundColor: colors.primary.pink }
              : {}
          }
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Characters
        </button>
        <button
          onClick={() => onTabChange("outline")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border-2 font-bold uppercase text-sm ${
            activeTab === "outline"
              ? "text-white border-black"
              : "text-gray-700 border-gray-300 hover:border-gray-400 bg-white"
          }`}
          style={
            activeTab === "outline"
              ? { backgroundColor: colors.primary.pink }
              : {}
          }
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Outline
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-700 font-mono">
          <div className="font-bold uppercase">Film & TV</div>
          <div className="flex items-center gap-1 mt-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Sep 8, 2024
          </div>
        </div>
        <button
          className="px-3 py-1.5 border-2 border-black rounded text-sm font-bold uppercase transition-colors text-white"
          style={{ backgroundColor: colors.primary.pink }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.pinkDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.pink;
          }}
        >
          Help
        </button>
        <button
          onClick={() => navigate("/scripts")}
          className="text-gray-700 hover:text-black transition-colors p-1 border-2 border-transparent hover:border-gray-300 rounded"
          title="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ScriptEditorHeader;
