import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import LoadingScreen from "../components/LoadingScreen";
import { colors } from "../lib/theme";
import ScriptEditorHeader from "../components/script-editor/ScriptEditorHeader";
import SceneNavigationSidebar from "../components/script-editor/SceneNavigationSidebar";
import SceneMetadataSidebar from "../components/script-editor/SceneMetadataSidebar";
import ScriptContentEditor from "../components/script-editor/ScriptContentEditor";
import ScriptEditorActions from "../components/script-editor/ScriptEditorActions";
import IndexCardView from "../components/script-editor/IndexCardView";
import type { SceneCard } from "../components/script-editor/IndexCard";
import { useScenesQuery } from "../queries/scenes/useScenesQuery";
import type { Scene } from "../types/api";

/**
 * Script Editor Page Component
 * Main container for script editing functionality
 * Follows SOLID principles by delegating to specialized components
 */
const ScriptEditorPage: React.FC = () => {
  const { scriptId, versionId } = useParams<{
    scriptId: string;
    versionId: string;
  }>();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  const [activeTab, setActiveTab] = useState<
    "scenes" | "script" | "characters" | "outline"
  >("script");
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [sceneNumber, setSceneNumber] = useState<string>("1205");
  const [filterValue, setFilterValue] = useState<string>("");
  const [groupingMode, setGroupingMode] = useState<
    "none" | "act" | "location" | "thread"
  >("none");

  const isFullscreen = isLeftSidebarCollapsed && isRightSidebarCollapsed;

  const scriptVersionId = versionId ? parseInt(versionId, 10) : 0;
  const {
    data: scenes = [],
    isLoading: scenesLoading,
    error: scenesError,
  } = useScenesQuery({
    scriptVersionId,
    enabled: !!versionId && activeTab === "script",
  });

  const selectedScene = Array.isArray(scenes)
    ? scenes.find((s) => s.id === selectedSceneId) || scenes[0] || null
    : null;

  useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const sampleScenes: SceneCard[] = [
    {
      id: 1,
      sceneNumber: 1,
      slugline: "EXT. BEACH – DAY",
      summary: "Barry arrives at the crime scene, late and disoriented",
      tone: "Calm",
      purpose: "Setup",
      duration: "0:45",
      characters: ["Barry", "Detective"],
      beats: [
        "Barry arrives late",
        "Sees the crime scene tape",
        "Meets Detective",
      ],
      notes: "Establish Barry's character through his lateness",
      act: "ACT 1",
      location: "Beach",
      status: "Draft",
    },
    {
      id: 2,
      sceneNumber: 2,
      slugline: "INT. HOTEL ROOM – DAWN",
      summary: "Barry removes earplugs and searches for his gun",
      tone: "Tense",
      purpose: "Reveal",
      duration: "1:10",
      characters: ["Barry"],
      beats: [
        "Barry removes earplugs",
        "Searches for gun",
        "Finds bullet holes",
      ],
      notes: "The bullet holes reveal something happened",
      act: "ACT 1",
      location: "Hotel",
      status: "Draft",
    },
    {
      id: 3,
      sceneNumber: 3,
      slugline: "EXT. BEACH – DAY",
      summary: "Barry confronts the killer in a tense standoff",
      tone: "Intense",
      purpose: "Confrontation",
      duration: "2:30",
      characters: ["Barry", "Villain"],
      beats: ["Barry arrives late", "Sees the body", "Confrontation explodes"],
      notes: "Too similar to Scene 8?",
      act: "ACT 2",
      location: "Beach",
      status: "Draft",
    },
    {
      id: 4,
      sceneNumber: 4,
      slugline: "INT. ELECTRONIC GEEK – DAY",
      summary: "Barry investigates the electronics store for clues",
      tone: "Calm",
      purpose: "Investigation",
      duration: "1:20",
      characters: ["Barry", "Store Owner"],
      beats: ["Barry questions owner", "Finds key evidence", "Leaves"],
      act: "ACT 2",
      location: "Store",
      status: "Draft",
    },
    {
      id: 5,
      sceneNumber: 5,
      slugline: "EXT. BEACH – NIGHT",
      summary: "The final confrontation between Barry and the villain",
      tone: "Intense",
      purpose: "Climax",
      duration: "3:15",
      characters: ["Barry", "Villain"],
      beats: ["Final standoff", "Barry's realization", "Resolution"],
      notes: "Make sure this escalates properly from Scene 3",
      act: "ACT 3",
      location: "Beach",
      status: "Draft",
    },
  ];

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: `/scripts/${scriptId}/versions/${versionId}`,
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, scriptId, versionId]);

  const handlePreviousScene = () => {
    if (!selectedScene || scenes.length === 0) return;
    const currentIndex = scenes.findIndex((s) => s.id === selectedScene.id);
    if (currentIndex > 0) {
      setSelectedSceneId(scenes[currentIndex - 1].id);
    }
  };

  const handleNextScene = () => {
    if (!selectedScene || scenes.length === 0) return;
    const currentIndex = scenes.findIndex((s) => s.id === selectedScene.id);
    if (currentIndex < scenes.length - 1) {
      setSelectedSceneId(scenes[currentIndex + 1].id);
    }
  };

  const handleFinishLater = () => {
    navigate("/scripts");
  };

  const handleBack = () => {
    navigate("/scripts");
  };

  const handleAcceptAndProceed = () => {
    console.log("Accept and proceed");
  };

  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      setIsLeftSidebarCollapsed(false);
      setIsRightSidebarCollapsed(false);
    } else {
      setIsLeftSidebarCollapsed(true);
      setIsRightSidebarCollapsed(true);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isLoading || scenesLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const sceneTitle = selectedScene?.slugline || "No scene selected";

  const handleSceneReorder = (newOrder: SceneCard[]) => {
    console.log("Scenes reordered:", newOrder);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background.beigeAlt }}
    >
      <ScriptEditorHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      {activeTab === "outline" ? (
        <IndexCardView
          scenes={sampleScenes}
          onSceneReorder={handleSceneReorder}
          groupingMode={groupingMode}
          onGroupingModeChange={setGroupingMode}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Scene Navigation */}
          {!isFullscreen && (
            <SceneNavigationSidebar
              isCollapsed={isLeftSidebarCollapsed}
              onToggleCollapse={() =>
                setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)
              }
              selectedScene={selectedScene?.scene_number || 0}
              onSceneSelect={(sceneNum) => {
                const scene = scenes.find((s) => s.scene_number === sceneNum);
                if (scene) setSelectedSceneId(scene.id);
              }}
              sceneNumber={sceneNumber}
              onSceneNumberChange={setSceneNumber}
              filterValue={filterValue}
              onFilterChange={setFilterValue}
              scenes={scenes}
            />
          )}

          {/* Central Panel - Script Content */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            <ScriptContentEditor
              selectedScene={selectedScene}
              scriptVersionId={scriptVersionId}
              sceneTitle={sceneTitle}
              onPreviousScene={handlePreviousScene}
              onNextScene={handleNextScene}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* Right Sidebar - Scene Metadata */}
          {!isFullscreen && (
            <SceneMetadataSidebar
              isCollapsed={isRightSidebarCollapsed}
              onToggleCollapse={() =>
                setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
              }
              selectedScene={selectedScene?.scene_number || 0}
              totalScenes={scenes.length}
            />
          )}
        </div>
      )}

      {/* Bottom Action Bar - Only show for script view */}
      {activeTab !== "outline" && (
        <ScriptEditorActions
          onFinishLater={handleFinishLater}
          onBack={handleBack}
          onAcceptAndProceed={handleAcceptAndProceed}
        />
      )}
    </div>
  );
};

export default ScriptEditorPage;
