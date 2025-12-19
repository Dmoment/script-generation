import React from "react";
import { colors } from "../lib/theme";

interface ThreadConnectorProps {
  /**
   * Whether this is the last item in the list
   * If true, the vertical line stops at 50% height
   */
  isLast?: boolean;
  /**
   * Color of the thread (defaults to pink)
   */
  color?: string;
  /**
   * Width of the thread container (defaults to 180px)
   */
  width?: string;
  /**
   * Height of the row (defaults to 48px for viewBox)
   */
  rowHeight?: number;
  /**
   * Horizontal position where vertical line starts (defaults to 24px - aligned with checkbox)
   */
  verticalLineX?: number;
  /**
   * Y position where the curve happens (defaults to 24 - middle of row)
   */
  curveY?: number;
  /**
   * X position where horizontal line ends (defaults to 140 - reaches badge area)
   */
  horizontalEndX?: number;
}

/**
 * ThreadConnector Component
 *
 * Creates a smooth curved thread connecting a parent row to a child row.
 * Used for showing hierarchical relationships in tables (e.g., scripts and their versions).
 *
 * @example
 * <ThreadConnector isLast={false} />
 */
const ThreadConnector: React.FC<ThreadConnectorProps> = ({
  isLast = false,
  color = colors.primary.pink,
  width = "180px",
  rowHeight = 48,
  verticalLineX = 24,
  curveY = 24,
  horizontalEndX = 140,
}) => {
  return (
    <div
      className="absolute left-0 top-0 h-full pointer-events-none"
      style={{ zIndex: 0, width }}
    >
      {/* Desktop: Full horizontal line */}
      <svg
        className="absolute left-0 top-0 w-full h-full hidden sm:block"
        style={{ zIndex: 1 }}
        viewBox={`0 0 180 ${rowHeight}`}
        preserveAspectRatio="none"
      >
        {/* Single continuous path with no breaks:
            - Vertical line from top to just before curve point
            - Smooth rounded curve at intersection (Q creates smooth 90° turn)
            - Horizontal curve extending to target area
            - For non-last: vertical continues to bottom via separate line
        */}
        {!isLast ? (
          <>
            <path
              d={`M ${verticalLineX} 0 L ${verticalLineX} ${
                curveY - 4
              } Q ${verticalLineX} ${curveY}, ${
                verticalLineX + 4
              } ${curveY} Q ${
                verticalLineX + 36
              } ${curveY}, ${horizontalEndX} ${curveY}`}
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Vertical continuation to bottom */}
            <line
              x1={verticalLineX}
              y1={curveY}
              x2={verticalLineX}
              y2={rowHeight}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d={`M ${verticalLineX} 0 L ${verticalLineX} ${
              curveY - 4
            } Q ${verticalLineX} ${curveY}, ${verticalLineX + 4} ${curveY} Q ${
              verticalLineX + 36
            } ${curveY}, ${horizontalEndX} ${curveY}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
      
      {/* Mobile: Shorter horizontal line to avoid crossing badge */}
      <svg
        className="absolute left-0 top-0 w-full h-full block sm:hidden"
        style={{ zIndex: 1 }}
        viewBox={`0 0 180 ${rowHeight}`}
        preserveAspectRatio="none"
      >
        {!isLast ? (
          <>
            <path
              d={`M ${verticalLineX} 0 L ${verticalLineX} ${
                curveY - 4
              } Q ${verticalLineX} ${curveY}, ${
                verticalLineX + 4
              } ${curveY} Q ${
                verticalLineX + 36
              } ${curveY}, ${Math.min(horizontalEndX, 100)} ${curveY}`}
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Vertical continuation to bottom */}
            <line
              x1={verticalLineX}
              y1={curveY}
              x2={verticalLineX}
              y2={rowHeight}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d={`M ${verticalLineX} 0 L ${verticalLineX} ${
              curveY - 4
            } Q ${verticalLineX} ${curveY}, ${verticalLineX + 4} ${curveY} Q ${
              verticalLineX + 36
            } ${curveY}, ${Math.min(horizontalEndX, 100)} ${curveY}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

export default ThreadConnector;
