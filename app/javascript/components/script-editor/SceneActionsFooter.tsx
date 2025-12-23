import React, { useState, useRef } from "react";
import { colors } from "../../lib/theme";
import type { Scene } from "../../types/api";

interface SceneActionsFooterProps {
  selectedScene: Scene | null;
  onCreateScene?: () => void;
  onDeleteScene?: (sceneId: number) => void;
  onLockScene?: (sceneId: number, locked: boolean) => void;
  scenes?: Scene[];
}

const SceneActionsFooter: React.FC<SceneActionsFooterProps> = ({
  selectedScene,
  onCreateScene,
  onDeleteScene,
  onLockScene,
  scenes = [],
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative bg-white">
      <div
        ref={buttonRef}
        className="relative h-12 flex items-center justify-center"
        style={{ padding: "8px" }}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={(e) => {
          const relatedTarget = e.relatedTarget as Node;
          if (
            !menuRef.current?.contains(relatedTarget) &&
            !buttonRef.current?.contains(relatedTarget)
          ) {
            setIsMenuOpen(false);
          }
        }}
      >
        {/* Plus Button - smaller, pink filled */}
        <button
          className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          style={{ backgroundColor: colors.primary.pink }}
          onClick={onCreateScene}
          title="Create new scene"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Semicircle Menu - appears on hover */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 z-50"
            style={{
              paddingBottom: "16px",
              paddingTop: "8px",
              paddingLeft: "30px",
              paddingRight: "30px",
              marginBottom: "-8px",
            }}
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={(e) => {
              const relatedTarget = e.relatedTarget as Node;
              if (!buttonRef.current?.contains(relatedTarget)) {
                setIsMenuOpen(false);
              }
            }}
          >
            <div className="relative">
              {/* Menu Items positioned in proper semicircle arc */}
              <div
                className="relative flex items-end justify-center gap-3"
                style={{ width: "140px", height: "60px" }}
              >
                {/* Create Scene Button - Left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateScene?.();
                    setIsMenuOpen(false);
                  }}
                  className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10"
                  title="Create new scene"
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
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>

                {/* Lock/Unlock Scene Button - Center (higher) */}
                {selectedScene &&
                  onLockScene &&
                  (() => {
                    const currentScene = scenes.find(
                      (s) => s.id === selectedScene.id
                    );
                    if (!currentScene) return null;
                    const isLocked = currentScene.metadata?.locked === true;

                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLockScene(currentScene.id, !isLocked);
                          setIsMenuOpen(false);
                        }}
                        className="w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10"
                        title={isLocked ? "Unlock scene" : "Lock scene"}
                        style={{
                          borderColor: isLocked ? "#D97706" : "#F59E0B",
                          marginBottom: "10px",
                        }}
                      >
                        <svg
                          className="w-5 h-5"
                          style={{ color: isLocked ? "#D97706" : "#F59E0B" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {isLocked ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          )}
                        </svg>
                      </button>
                    );
                  })()}

                {/* Delete Scene Button - Right */}
                {selectedScene &&
                  onDeleteScene &&
                  (() => {
                    const currentScene = scenes.find(
                      (s) => s.id === selectedScene.id
                    );
                    if (!currentScene) return null;

                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete Scene ${currentScene.scene_number}: "${
                                currentScene.slugline || "Untitled"
                              }"?`
                            )
                          ) {
                            onDeleteScene(currentScene.id);
                          }
                          setIsMenuOpen(false);
                        }}
                        className="w-10 h-10 rounded-full bg-white border-2 border-red-600 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10"
                        title="Delete current scene"
                      >
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneActionsFooter;

