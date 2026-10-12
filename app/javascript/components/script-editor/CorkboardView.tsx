import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { colors } from "../../lib/theme";
import type { SceneCard } from "./IndexCard";

interface CorkboardViewProps {
  scenes: SceneCard[];
  onCardPositionChange: (sceneId: number, x: number, y: number) => void;
  onResetLayout?: () => void;
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 180;
const GRID_GAP = 28;
const GRID_COLS = 4;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;
const DRAG_THRESHOLD_PX = 3;

const defaultGridPosition = (index: number) => ({
  x: (index % GRID_COLS) * (CARD_WIDTH + GRID_GAP),
  y: Math.floor(index / GRID_COLS) * (CARD_HEIGHT + GRID_GAP),
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const CorkboardView: React.FC<CorkboardViewProps> = ({
  scenes,
  onCardPositionChange,
  onResetLayout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [localPositions, setLocalPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const dragStateRef = useRef<
    | {
        type: "card";
        sceneId: number;
        startClientX: number;
        startClientY: number;
        startCardX: number;
        startCardY: number;
        moved: boolean;
      }
    | {
        type: "canvas";
        startClientX: number;
        startClientY: number;
        startPanX: number;
        startPanY: number;
      }
    | null
  >(null);
  const [activeDragCardId, setActiveDragCardId] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const positions = useMemo(() => {
    const map: Record<number, { x: number; y: number }> = {};
    scenes.forEach((scene, index) => {
      const local = localPositions[scene.id];
      if (local) {
        map[scene.id] = local;
        return;
      }
      if (
        typeof scene.positionX === "number" &&
        typeof scene.positionY === "number"
      ) {
        map[scene.id] = { x: scene.positionX, y: scene.positionY };
        return;
      }
      map[scene.id] = defaultGridPosition(index);
    });
    return map;
  }, [scenes, localPositions]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // Ctrl/Cmd + wheel: zoom around cursor; otherwise: pan.
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const zoomDelta = -e.deltaY * 0.0015;
        const nextZoom = clamp(zoom * (1 + zoomDelta), MIN_ZOOM, MAX_ZOOM);
        // Keep the point under the cursor stationary.
        const worldX = (cursorX - pan.x) / zoom;
        const worldY = (cursorY - pan.y) / zoom;
        const newPanX = cursorX - worldX * nextZoom;
        const newPanY = cursorY - worldY * nextZoom;
        setZoom(nextZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    },
    [pan, zoom]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Prevent the browser from doing page zoom on ctrl+wheel over the canvas.
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    container.addEventListener("wheel", preventBrowserZoom, { passive: false });
    return () => container.removeEventListener("wheel", preventBrowserZoom);
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only start panning if the target is the canvas itself, not a card.
      if (e.target !== e.currentTarget) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStateRef.current = {
        type: "canvas",
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      setIsPanning(true);
    },
    [pan]
  );

  const handleCardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, sceneId: number) => {
      e.stopPropagation();
      const current = positions[sceneId];
      if (!current) return;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      dragStateRef.current = {
        type: "card",
        sceneId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCardX: current.x,
        startCardY: current.y,
        moved: false,
      };
      setActiveDragCardId(sceneId);
    },
    [positions]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      if (!state) return;
      if (state.type === "canvas") {
        setPan({
          x: state.startPanX + (e.clientX - state.startClientX),
          y: state.startPanY + (e.clientY - state.startClientY),
        });
      } else {
        const dx = (e.clientX - state.startClientX) / zoom;
        const dy = (e.clientY - state.startClientY) / zoom;
        if (
          !state.moved &&
          Math.hypot(e.clientX - state.startClientX, e.clientY - state.startClientY) >
            DRAG_THRESHOLD_PX
        ) {
          state.moved = true;
        }
        if (state.moved) {
          setLocalPositions((prev) => ({
            ...prev,
            [state.sceneId]: {
              x: state.startCardX + dx,
              y: state.startCardY + dy,
            },
          }));
        }
      }
    },
    [zoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      if (!state) return;
      (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
      if (state.type === "card" && state.moved) {
        const next = localPositions[state.sceneId];
        if (next) {
          onCardPositionChange(state.sceneId, next.x, next.y);
        }
      }
      dragStateRef.current = null;
      setActiveDragCardId(null);
      setIsPanning(false);
    },
    [localPositions, onCardPositionChange]
  );

  const zoomIn = () =>
    setZoom((z) => clamp(z * 1.2, MIN_ZOOM, MAX_ZOOM));
  const zoomOut = () =>
    setZoom((z) => clamp(z / 1.2, MIN_ZOOM, MAX_ZOOM));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  const fitToView = useCallback(() => {
    if (scenes.length === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const xs = scenes.map((s) => positions[s.id]?.x ?? 0);
    const ys = scenes.map((s) => positions[s.id]?.y ?? 0);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + CARD_WIDTH;
    const maxY = Math.max(...ys) + CARD_HEIGHT;
    const boundsW = maxX - minX;
    const boundsH = maxY - minY;
    const rect = container.getBoundingClientRect();
    const padding = 80;
    const scale = clamp(
      Math.min(
        (rect.width - padding * 2) / boundsW,
        (rect.height - padding * 2) / boundsH
      ),
      MIN_ZOOM,
      MAX_ZOOM
    );
    setZoom(scale);
    setPan({
      x: (rect.width - boundsW * scale) / 2 - minX * scale,
      y: (rect.height - boundsH * scale) / 2 - minY * scale,
    });
  }, [positions, scenes]);

  const cursor = isPanning ? "grabbing" : "grab";

  return (
    <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#f4efe5" }}>
      {/* Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0"
        style={{
          cursor,
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {scenes.map((scene) => {
            const pos = positions[scene.id] || { x: 0, y: 0 };
            const isDragging = activeDragCardId === scene.id;
            return (
              <div
                key={scene.id}
                onPointerDown={(e) => handleCardPointerDown(e, scene.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: CARD_WIDTH,
                  cursor: isDragging ? "grabbing" : "grab",
                  boxShadow: isDragging
                    ? "6px 6px 0 rgba(0,0,0,0.9)"
                    : "3px 3px 0 rgba(0,0,0,0.9)",
                  transform: isDragging ? "scale(1.02)" : undefined,
                  transition: isDragging
                    ? "none"
                    : "box-shadow 120ms ease, transform 120ms ease",
                  zIndex: isDragging ? 10 : 1,
                }}
                className="bg-white border-2 border-black rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-black uppercase text-black"
                    style={{ fontFamily: 'Courier, "Courier New", monospace' }}
                  >
                    SCENE {scene.sceneNumber}
                  </span>
                  {scene.act && (
                    <span
                      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: colors.primary.pink,
                        color: "#FFFFFF",
                      }}
                    >
                      {scene.act}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs font-bold text-black mb-2 leading-snug"
                  style={{
                    fontFamily: 'Courier, "Courier New", monospace',
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {scene.slugline}
                </p>
                {scene.summary && (
                  <p
                    className="text-xs text-gray-800 leading-relaxed"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {scene.summary}
                  </p>
                )}
                {scene.characters.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {scene.characters.slice(0, 3).map((name) => (
                      <span
                        key={name}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700"
                      >
                        {name}
                      </span>
                    ))}
                    {scene.characters.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{scene.characters.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white border-2 border-black rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.9)] px-1 py-1 z-20">
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 rounded"
          title="Zoom out"
        >
          −
        </button>
        <div className="text-xs font-mono font-bold w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 rounded"
          title="Zoom in"
        >
          +
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={fitToView}
          className="px-2 h-8 text-xs font-bold uppercase hover:bg-gray-100 rounded"
          title="Fit all cards on screen"
        >
          Fit
        </button>
        <button
          onClick={resetView}
          className="px-2 h-8 text-xs font-bold uppercase hover:bg-gray-100 rounded"
          title="Reset zoom and pan"
        >
          1:1
        </button>
        {onResetLayout && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={onResetLayout}
              className="px-2 h-8 text-xs font-bold uppercase hover:bg-gray-100 rounded"
              title="Snap all cards back to grid"
            >
              Grid
            </button>
          </>
        )}
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-4 text-[11px] font-mono text-gray-600 bg-white/80 border border-gray-300 rounded px-2 py-1 pointer-events-none">
        Drag empty space to pan · Ctrl/⌘+scroll to zoom · Drag cards to move
      </div>
    </div>
  );
};

export default CorkboardView;
