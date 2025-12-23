import React from "react";
import { colors } from "../../lib/theme";
import SceneTextEditor from "./SceneTextEditor";
import type { Scene } from "../../types/api";

interface ScriptContentEditorProps {
  selectedScene: Scene | null;
  scriptVersionId: number;
  sceneTitle: string;
  onPreviousScene: () => void;
  onNextScene: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const ScriptContentEditor: React.FC<ScriptContentEditorProps> = ({
  selectedScene,
  scriptVersionId,
  sceneTitle,
  onPreviousScene,
  onNextScene,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      <div
        className="px-6 py-3 border-b-2 border-black flex items-center justify-between"
        style={{ backgroundColor: colors.background.beigeAlt }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onPreviousScene}
            className="p-1 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300"
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
          <button
            className="px-4 py-1.5 text-white rounded text-sm font-bold uppercase border-2 border-black"
            style={{ backgroundColor: colors.primary.pink }}
          >
            Scene {selectedScene?.scene_number || "—"}
          </button>
          <span className="text-sm text-black font-mono uppercase">
            {selectedScene?.slugline || sceneTitle}
          </span>
          <button
            onClick={onNextScene}
            className="p-1 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300"
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
        <button
          onClick={onToggleFullscreen}
          className="p-1 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300 transition-colors"
          title={isFullscreen ? "Restore sidebars" : "Expand to fullscreen"}
        >
          {isFullscreen ? (
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          ) : (
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
      </div>

      <SceneTextEditor
        scene={selectedScene}
        scriptVersionId={scriptVersionId}
      />
    </div>
  );
};

export default ScriptContentEditor;
