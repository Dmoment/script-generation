import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUpdateSceneMutation } from "../../queries/scenes/useUpdateSceneMutation";
import type { Scene } from "../../types/api";

interface SceneTextEditorProps {
  scene: Scene | null;
  scriptVersionId: number;
  onContentChange?: (content: string) => void;
  onFinishScene?: () => void;
  isLastScene?: boolean;
}

const SceneTextEditor: React.FC<SceneTextEditorProps> = ({
  scene,
  scriptVersionId,
  onContentChange,
  onFinishScene,
  isLastScene = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<string>(scene?.content || "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSceneMutation = useUpdateSceneMutation();

  useEffect(() => {
    if (scene) {
      setContent(scene.content || "");

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [scene?.id, scene?.content]);

  const saveContent = useCallback(
    async (contentToSave: string) => {
      if (!scene || !contentToSave.trim()) return;

      try {
        await updateSceneMutation.mutateAsync({
          id: scene.id,
          content: contentToSave,
        });
        onContentChange?.(contentToSave);
      } catch (error) {
        console.error("Failed to save scene content:", error);
      }
    },
    [scene, updateSceneMutation, onContentChange]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (onFinishScene) {
        onFinishScene();
      }
    }
  };

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-mono mb-2">No scene selected</p>
          <p className="text-xs text-gray-400 font-mono">
            Select a scene from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={
              content
                ? undefined
                : "Start typing your script content...\n\nClick here and start typing. The cursor should appear."
            }
            className="w-full min-h-[600px] resize-none border-none outline-none bg-white text-sm leading-relaxed text-gray-900 focus:outline-none focus:ring-0 focus:border-none"
            style={{
              fontFamily: 'Courier, "Courier New", monospace',
              lineHeight: "1.8",
              caretColor: "#000000",
              cursor: "text",
            }}
            spellCheck={false}
            autoFocus
            onClick={(e) => {
              e.currentTarget.focus();
              const textarea = e.currentTarget;
              const len = textarea.value.length;
              textarea.setSelectionRange(len, len);
            }}
            onFocus={(e) => {
              e.currentTarget.style.caretColor = "#000000";
              const len = e.currentTarget.value.length;
              if (len > 0) {
                e.currentTarget.setSelectionRange(len, len);
              }
            }}
          />
          {!content && (
            <div className="mt-2 text-xs text-gray-400 font-mono">
              💡 Click in the text area above and start typing. The cursor
              should appear.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneTextEditor;
