import React, { useState, useRef, useEffect } from "react";
import { colors } from "../../lib/theme";
import SceneTextEditor from "./SceneTextEditor";
import EditableSlugline from "./EditableSlugline";
import SceneActionsFooter from "./SceneActionsFooter";
import { useUpdateSceneMutation } from "../../queries/scenes/useUpdateSceneMutation";
import type { Scene } from "../../types/api";

interface ScriptContentEditorProps {
  selectedScene: Scene | null;
  scriptVersionId: number;
  sceneTitle: string;
  onPreviousScene: () => void;
  onNextScene: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  isLastScene?: boolean;
  totalScenes?: number;
  onCreateScene?: () => void;
  onDeleteScene?: (sceneId: number) => void;
  onLockScene?: (sceneId: number, locked: boolean) => void;
  scenes?: Scene[];
}

const ScriptContentEditor: React.FC<ScriptContentEditorProps> = ({
  selectedScene,
  scriptVersionId,
  sceneTitle,
  onPreviousScene,
  onNextScene,
  onToggleFullscreen,
  isFullscreen = false,
  isLastScene = false,
  totalScenes = 0,
  onCreateScene,
  onDeleteScene,
  onLockScene,
  scenes = [],
}) => {
  const [isEditingSlugline, setIsEditingSlugline] = useState(false);
  const [sluglineValue, setSluglineValue] = useState(
    selectedScene?.slugline || ""
  );
  const sluglineInputRef = useRef<HTMLInputElement>(null);
  const updateSceneMutation = useUpdateSceneMutation();

  useEffect(() => {
    if (selectedScene) {
      setSluglineValue(selectedScene.slugline || "");
      setIsEditingSlugline(false);
    }
  }, [selectedScene?.id, selectedScene?.slugline]);

  useEffect(() => {
    if (isEditingSlugline && sluglineInputRef.current) {
      sluglineInputRef.current.focus();
      sluglineInputRef.current.select();
    }
  }, [isEditingSlugline]);

  const handleSluglineSave = async () => {
    if (!selectedScene) return;

    const trimmedValue = sluglineValue.trim();

    if (trimmedValue === (selectedScene.slugline || "")) {
      setIsEditingSlugline(false);
      return;
    }

    try {
      await updateSceneMutation.mutateAsync({
        id: selectedScene.id,
        slugline: trimmedValue || undefined,
      });
      setIsEditingSlugline(false);
    } catch (error) {
      console.error("Failed to update slugline:", error);
      setSluglineValue(selectedScene.slugline || "");
      setIsEditingSlugline(false);
    }
  };

  const handleSluglineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSluglineSave();
    } else if (e.key === "Escape") {
      setSluglineValue(selectedScene?.slugline || "");
      setIsEditingSlugline(false);
    }
  };
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
          {isEditingSlugline ? (
            <div className="flex items-center gap-2">
              <input
                ref={sluglineInputRef}
                type="text"
                value={sluglineValue}
                onChange={(e) => setSluglineValue(e.target.value)}
                onBlur={handleSluglineSave}
                onKeyDown={handleSluglineKeyDown}
                className="text-sm text-black font-mono uppercase bg-white border-2 border-black px-3 py-1.5 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 min-w-[300px] rounded transition-all"
                style={{ fontFamily: 'Courier, "Courier New", monospace' }}
                placeholder="INT. LOCATION - DAY"
              />
              <button
                onClick={handleSluglineSave}
                className="p-1.5 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300 transition-colors"
                title="Save (Enter)"
              >
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSluglineValue(selectedScene?.slugline || "");
                  setIsEditingSlugline(false);
                }}
                className="p-1.5 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300 transition-colors"
                title="Cancel (Esc)"
              >
                <svg
                  className="w-4 h-4 text-red-600"
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
          ) : (
            <EditableSlugline
              slugline={selectedScene?.slugline || sceneTitle || ""}
              placeholder="INT. LOCATION - DAY"
              onEdit={() => setIsEditingSlugline(true)}
            />
          )}
          <button
            onClick={onNextScene}
            className="p-1 hover:bg-gray-200 rounded border-2 border-transparent hover:border-gray-300 relative"
            title={isLastScene ? "Create next scene" : "Next scene"}
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
            {isLastScene && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
            )}
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
        onFinishScene={onNextScene}
        isLastScene={isLastScene}
      />

      <SceneActionsFooter
        selectedScene={selectedScene}
        onCreateScene={onCreateScene}
        onDeleteScene={onDeleteScene}
        onLockScene={onLockScene}
        scenes={scenes}
      />
    </div>
  );
};

export default ScriptContentEditor;
