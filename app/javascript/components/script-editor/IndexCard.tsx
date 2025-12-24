import React, { useState } from "react";
import { colors } from "../../lib/theme";

export interface SceneCard {
  id: number;
  sceneNumber: number;
  slugline: string;
  summary: string;
  tone: string;
  purpose: string;
  duration: string; // e.g., "1:10"
  characters: string[];
  beats?: string[];
  notes?: string;
  act?: string;
  location?: string;
  status?: string;
}

interface IndexCardProps {
  scene: SceneCard;
  isExpanded: boolean;
  onExpand: (sceneId: number) => void;
  onCollapse: () => void;
  actColor?: string;
  toneColor?: string;
}

const IndexCard: React.FC<IndexCardProps> = ({
  scene,
  isExpanded,
  onExpand,
  onCollapse,
  actColor,
  toneColor,
}) => {
  const handleClick = () => {
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand(scene.id);
    }
  };

  const getToneColor = (tone: string): string => {
    const toneMap: Record<string, string> = {
      calm: "#DBEAFE", // Light blue
      tense: "#FEE2E2", // Light red
      intense: "#FECACA", // Red
      warm: "#FEF3C7", // Yellow
      cool: "#DBEAFE", // Blue
    };
    return toneMap[tone.toLowerCase()] || "#F9FAFB";
  };

  const cardToneColor = toneColor || getToneColor(scene.tone);

  return (
    <div
      onClick={handleClick}
      className="bg-white border-2 border-black rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      style={{
        backgroundColor: isExpanded ? "#FEFEFE" : "#FFFFFF",
        borderColor: actColor || "#000000",
        boxShadow: isExpanded
          ? "4px 4px 0px 0px rgba(0,0,0,1)"
          : "2px 2px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-black uppercase text-black"
              style={{ fontFamily: 'Courier, "Courier New", monospace' }}
            >
              SCENE {scene.sceneNumber}
            </span>
            {scene.act && (
              <span
                className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: actColor || colors.primary.pink,
                  color: "#FFFFFF",
                  borderColor: actColor || colors.primary.pink,
                }}
              >
                {scene.act}
              </span>
            )}
          </div>
          <p
            className="text-sm font-bold text-black mb-2"
            style={{ fontFamily: 'Courier, "Courier New", monospace' }}
          >
            {scene.slugline}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-800 mb-3 leading-relaxed">
        {scene.summary}
      </p>

      {/* Metadata Row */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cardToneColor }}
          ></span>
          <span className="font-semibold text-gray-700">Tone:</span>
          <span className="text-gray-600">{scene.tone}</span>
        </div>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">
          <span className="font-semibold">Purpose:</span> {scene.purpose}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-3">
          {scene.beats && scene.beats.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase text-black mb-2 font-mono">
                BEATS
              </h4>
              <ul className="space-y-1">
                {scene.beats.map((beat, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start gap-2"
                  >
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{beat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scene.notes && (
            <div>
              <h4 className="text-xs font-black uppercase text-black mb-2 font-mono">
                NOTES
              </h4>
              <p className="text-sm text-gray-700 italic">{scene.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-600">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{scene.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
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
          <span>{scene.characters.join(", ")}</span>
        </div>
      </div>
    </div>
  );
};

export default IndexCard;


