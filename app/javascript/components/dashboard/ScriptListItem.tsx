import React, { useState } from "react";
import { colors, getStatusStyles, getVersionBadgeColor } from "../../lib/theme";
import type { Script, ScriptVersion } from "../../types/api";

interface ScriptListItemProps {
  script: Script;
  projectTitle?: string;
  versions?: ScriptVersion[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
}

const ScriptListItem: React.FC<ScriptListItemProps> = ({
  script,
  projectTitle,
  versions = [],
  isExpanded = false,
  onToggleExpand,
  onClick,
}) => {
  const statusStyles = getStatusStyles(script.status);
  const formattedDate = new Date(script.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <>
      <div
        className={`group bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
          isExpanded ? "bg-blue-50" : ""
        }`}
      >
        <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 items-center">
          {/* Expand/Collapse Icon */}
          <div className="col-span-1 flex items-center">
            {versions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
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
            )}
          </div>

          {/* Project/Title Column */}
          <div className="col-span-4 min-w-0" onClick={onClick}>
            <div className="flex items-center gap-2">
              {projectTitle && (
                <>
                  <h3 className="font-medium text-sm text-gray-900 group-hover:text-black truncate">
                    {projectTitle}
                  </h3>
                  <span className="text-gray-400">•</span>
                </>
              )}
              <h3 className="font-medium text-sm text-gray-900 group-hover:text-black truncate">
                {script.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {script.latest_version_number > 0 &&
                (() => {
                  const badgeColor = getVersionBadgeColor(
                    script.latest_version_number
                  );
                  return (
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: badgeColor.bg,
                        color: badgeColor.text,
                        borderColor: badgeColor.text,
                      }}
                    >
                      v{script.latest_version_number}
                    </span>
                  );
                })()}
            </div>
          </div>

          {/* Upload Date Column */}
          <div className="col-span-2">
            <span className="text-sm text-gray-500">{formattedDate}</span>
          </div>

          {/* Category Column */}
          <div className="col-span-2">
            <span className="text-sm text-gray-600 uppercase">
              {script.script_type}
            </span>
          </div>

          {/* Pages Column */}
          <div className="col-span-1">
            <span className="text-sm text-gray-600">—</span>
          </div>

          {/* Status Column */}
          <div className="col-span-2">
            <span
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
              style={{
                backgroundColor: statusStyles.bg,
                color: statusStyles.text,
                borderColor: statusStyles.border,
                minWidth: "80px",
              }}
            >
              {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Versions */}
      {isExpanded && versions.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200">
          {versions.map((version) => {
            const versionBadgeColor = getVersionBadgeColor(
              version.version_number
            );
            const versionDate = new Date(version.created_at).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );
            const isActive =
              version.version_number === script.latest_version_number;

            return (
              <div
                key={version.id}
                className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 pl-8 items-center border-b border-gray-200 last:border-b-0"
              >
                <div className="col-span-1"></div>
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: versionBadgeColor.bg,
                        color: versionBadgeColor.text,
                        borderColor: versionBadgeColor.text,
                      }}
                    >
                      v{version.version_number}
                    </span>
                    <span className="text-sm text-gray-700">
                      {script.title} -{" "}
                      {version.notes || `script ${versionDate}`}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">{versionDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">—</span>
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-gray-600">—</span>
                </div>
                <div className="col-span-2">
                  <span
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
                    style={{
                      backgroundColor: isActive ? statusStyles.bg : "#F9FAFB",
                      color: isActive ? statusStyles.text : "#6B7280",
                      borderColor: isActive ? statusStyles.border : "#D1D5DB",
                      minWidth: "80px",
                    }}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ScriptListItem;
