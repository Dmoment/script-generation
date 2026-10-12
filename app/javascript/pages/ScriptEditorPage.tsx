import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from '../hooks/useAuth';
import LoadingScreen from "../components/LoadingScreen";
import { colors } from "../lib/theme";
import ScriptEditorHeader, { type EditorTab } from "../components/script-editor/ScriptEditorHeader";
import CharactersView from "../components/script-editor/CharactersView";
import BreakdownView from "../components/script-editor/BreakdownView";
import { useScriptQuery } from "../queries/scripts/useScriptQuery";
import { useRevisionsQuery } from "../queries/versions/useVersionQueries";
import SceneNavigationSidebar from "../components/script-editor/SceneNavigationSidebar";
import SceneMetadataSidebar from "../components/script-editor/SceneMetadataSidebar";
import ScriptContentEditor from "../components/script-editor/ScriptContentEditor";
import ScriptEditorActions from "../components/script-editor/ScriptEditorActions";
import IndexCardView from "../components/script-editor/IndexCardView";
import FormatScriptModal from "../components/script-editor/FormatScriptModal";
import type { SceneCard } from "../components/script-editor/IndexCard";
import { useScenesQuery } from "../queries/scenes/useScenesQuery";
import { useCreateSceneMutation } from "../queries/scenes/useCreateSceneMutation";
import { useDeleteSceneMutation } from "../queries/scenes/useDeleteSceneMutation";
import { useUpdateSceneMutation } from "../queries/scenes/useUpdateSceneMutation";
import { useReorderScenesMutation } from "../queries/scenes/useReorderScenesMutation";
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

  const [activeTab, setActiveTab] = useState<EditorTab>("script");
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [sceneNumber, setSceneNumber] = useState<string>("1205");
  const [filterValue, setFilterValue] = useState<string>("");
  const [groupingMode, setGroupingMode] = useState<
    "none" | "act" | "location" | "thread"
  >("none");
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  const isFullscreen = isLeftSidebarCollapsed && isRightSidebarCollapsed;

  const scriptVersionId = versionId ? parseInt(versionId, 10) : 0;
  const {
    data: scenes = [],
    isLoading: scenesLoading,
    error: scenesError,
  } = useScenesQuery({
    scriptVersionId,
    enabled: !!versionId,
  });
  const { data: script } = useScriptQuery({ scriptId: scriptId ? parseInt(scriptId, 10) : 0, enabled: isAuthenticated });
  const { data: revisions } = useRevisionsQuery(scriptVersionId, isAuthenticated);
  const revisedSceneIds = useMemo(() => new Set(revisions?.changed_scene_ids || []), [revisions]);
  const createSceneMutation = useCreateSceneMutation();
  const deleteSceneMutation = useDeleteSceneMutation();
  const updateSceneMutation = useUpdateSceneMutation();
  const reorderScenesMutation = useReorderScenesMutation();

  const selectedScene = Array.isArray(scenes)
    ? scenes.find((s) => s.id === selectedSceneId) || scenes[0] || null
    : null;

  useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  // Switching drafts: the scene ids change, so re-select from the new list.
  useEffect(() => {
    setSelectedSceneId(null);
  }, [scriptVersionId]);

  const openScene = useCallback((sceneId: number) => {
    setSelectedSceneId(sceneId);
    setActiveTab("script");
  }, []);

  const sceneCards: SceneCard[] = useMemo(() => {
    if (!Array.isArray(scenes)) return [];

    const deriveSummary = (scene: Scene): string => {
      const metaSummary = scene.metadata?.summary;
      if (typeof metaSummary === "string" && metaSummary.trim()) {
        return metaSummary;
      }
      const firstAction = scene.elements?.find((el) => el.type === "action");
      if (firstAction?.text) {
        return firstAction.text.length > 180
          ? `${firstAction.text.slice(0, 177)}…`
          : firstAction.text;
      }
      const content = (scene.content || "").trim();
      if (!content) return "";
      return content.length > 180 ? `${content.slice(0, 177)}…` : content;
    };

    const deriveLocation = (scene: Scene): string | undefined => {
      if (typeof scene.metadata?.location === "string") return scene.metadata.location;
      return scene.locations?.[0];
    };

    return [...scenes]
      .sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number))
      .map((scene) => ({
        id: scene.id,
        sceneNumber: scene.scene_number,
        slugline: scene.slugline || "(no slugline)",
        summary: deriveSummary(scene),
        tone: (scene.metadata?.tone as string) || "Neutral",
        purpose: (scene.metadata?.purpose as string) || "—",
        duration: (scene.metadata?.duration as string) || "—",
        characters: scene.character_names || [],
        beats: (scene.metadata?.beats as string[]) || [],
        notes: scene.metadata?.notes,
        act: scene.metadata?.act,
        location: deriveLocation(scene),
        status: (scene.metadata?.status as string) || "Draft",
        positionX: typeof scene.metadata?.card_x === "number" ? scene.metadata.card_x : undefined,
        positionY: typeof scene.metadata?.card_y === "number" ? scene.metadata.card_y : undefined,
      }));
  }, [scenes]);

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

  const handleNextScene = async () => {
    if (!selectedScene || scenes.length === 0) return;
    const currentIndex = scenes.findIndex((s) => s.id === selectedScene.id);
    if (currentIndex < scenes.length - 1) {
      setSelectedSceneId(scenes[currentIndex + 1].id);
    } else {
      await handleCreateNextScene();
    }
  };

  const handleCreateNextScene = async () => {
    if (!selectedScene || !scriptVersionId) return;
    
    const nextSceneNumber = (selectedScene.scene_number || scenes.length) + 1;
    
    try {
      const newScene = await createSceneMutation.mutateAsync({
        script_version_id: scriptVersionId,
        scene_number: nextSceneNumber,
        slugline: "INT. LOCATION - DAY",
        content: "",
        order: nextSceneNumber,
      });
      
      setSelectedSceneId(newScene.id);
    } catch (error) {
      console.error("Failed to create new scene:", error);
    }
  };

  const handleCreateScene = async () => {
    if (!scriptVersionId) return;
    
    const nextSceneNumber = scenes.length > 0 
      ? Math.max(...scenes.map(s => s.scene_number)) + 1
      : 1;
    
    try {
      const newScene = await createSceneMutation.mutateAsync({
        script_version_id: scriptVersionId,
        scene_number: nextSceneNumber,
        slugline: "INT. LOCATION - DAY",
        content: "",
        order: nextSceneNumber,
      });
      
      setSelectedSceneId(newScene.id);
    } catch (error) {
      console.error("Failed to create new scene:", error);
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    try {
      await deleteSceneMutation.mutateAsync(sceneId);
      
      const deletedScene = scenes.find(s => s.id === sceneId);
      if (deletedScene && selectedSceneId === sceneId) {
        const remainingScenes = scenes.filter(s => s.id !== sceneId);
        if (remainingScenes.length > 0) {
          setSelectedSceneId(remainingScenes[0].id);
        } else {
          setSelectedSceneId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete scene:", error);
    }
  };

  const handleLockScene = async (sceneId: number, locked: boolean) => {
    if (!selectedScene || selectedScene.id !== sceneId) return;
    
    try {
      await updateSceneMutation.mutateAsync({
        id: sceneId,
        metadata: {
          ...selectedScene.metadata,
          locked: locked,
        },
      });
    } catch (error) {
      console.error("Failed to lock/unlock scene:", error);
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

  // Dragging a card on the corkboard reflows the script: scene numbers and
  // order follow the new sequence in a single request.
  const handleSceneReorder = useCallback(
    (newOrder: SceneCard[]) => {
      if (!Array.isArray(scenes) || !scriptVersionId) return;
      const sceneIds = newOrder.map((card) => card.id);
      const currentIds = [...scenes]
        .sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number))
        .map((s) => s.id);
      if (sceneIds.length !== currentIds.length || sceneIds.every((id, i) => id === currentIds[i])) return;
      reorderScenesMutation.mutate({ scriptVersionId, sceneIds });
    },
    [scenes, scriptVersionId, reorderScenesMutation]
  );

  const handleCardPositionChange = useCallback(
    (sceneId: number, x: number, y: number) => {
      const scene = Array.isArray(scenes) ? scenes.find((s) => s.id === sceneId) : null;
      if (!scene) return;
      updateSceneMutation.mutate({
        id: sceneId,
        metadata: {
          ...(scene.metadata || {}),
          card_x: Math.round(x),
          card_y: Math.round(y),
        },
      });
    },
    [scenes, updateSceneMutation]
  );

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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background.beigeAlt }}
    >
      <ScriptEditorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFormatScript={() => setIsFormatModalOpen(true)}
        scriptId={scriptId}
        scriptVersionId={scriptVersionId}
        script={script}
      />

      {/* Main Content Area */}
      {activeTab === "outline" ? (
        <IndexCardView
          scenes={sceneCards}
          onSceneReorder={handleSceneReorder}
          onCardPositionChange={handleCardPositionChange}
          groupingMode={groupingMode}
          onGroupingModeChange={setGroupingMode}
        />
      ) : activeTab === "characters" ? (
        <CharactersView scenes={scenes} onOpenScene={openScene} />
      ) : activeTab === "breakdown" ? (
        <BreakdownView scriptVersionId={scriptVersionId} onOpenScene={openScene} />
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
              revisedSceneIds={revisedSceneIds}
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
                    isLastScene={selectedScene ? scenes.findIndex((s) => s.id === selectedScene.id) === scenes.length - 1 : false}
                    totalScenes={scenes.length}
                    onCreateScene={handleCreateScene}
                    onDeleteScene={handleDeleteScene}
                    onLockScene={handleLockScene}
                    scenes={scenes}
                  />
          </div>

          {/* Right Sidebar - Scene Metadata */}
          {!isFullscreen && (
            <SceneMetadataSidebar
              isCollapsed={isRightSidebarCollapsed}
              onToggleCollapse={() =>
                setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
              }
              scene={selectedScene}
              sceneIndex={selectedScene ? scenes.findIndex((s) => s.id === selectedScene.id) + 1 : 0}
              totalScenes={scenes.length}
            />
          )}
        </div>
      )}

      {/* Bottom Action Bar - Only show for script view */}
      {activeTab === "script" && (
        <ScriptEditorActions
          onFinishLater={handleFinishLater}
          onBack={handleBack}
          onAcceptAndProceed={handleAcceptAndProceed}
        />
      )}

      {/* Format Script Modal */}
      <FormatScriptModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        scriptVersionId={scriptVersionId}
      />
    </div>
  );
};

export default ScriptEditorPage;
