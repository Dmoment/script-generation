import React, { useState, useRef, useEffect } from "react";
import { colors, getStatusStyles, getVersionBadgeColor } from "../../lib/theme";
import type { Script, ScriptVersion } from "../../types/api";

interface ScriptCardProps {
  script: Script;
  projectTitle?: string;
  versions?: ScriptVersion[];
  onClick?: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  projectTitle,
  versions = [],
  onClick,
}) => {
  const [showRemainingVersions, setShowRemainingVersions] = useState(false);
  const remainingVersionsRef = useRef<HTMLDivElement>(null);

  const statusStyles = getStatusStyles(script.status);
  const formattedDate = new Date(script.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const sortedVersions = [...versions].sort(
    (a, b) => (a.version_number || 0) - (b.version_number || 0)
  );

  // Show first 4 versions, rest in "+X"
  const visibleVersions = sortedVersions.slice(0, 4);
  const remainingCount = sortedVersions.length - 4;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        remainingVersionsRef.current &&
        !remainingVersionsRef.current.contains(event.target as Node)
      ) {
        setShowRemainingVersions(false);
      }
    };

    if (showRemainingVersions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRemainingVersions]);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-black group-hover:underline decoration-2 underline-offset-2 truncate">
            {script.title}
          </h3>
          {projectTitle && (
            <p className="text-xs font-mono text-gray-500 mt-1 uppercase truncate">
              {projectTitle}
            </p>
          )}
          <p className="text-xs font-mono text-gray-400 mt-1">
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs font-bold uppercase px-2 py-1 border border-black bg-gray-100">
            v{script.latest_version_number}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-600 uppercase">
          {script.script_type}
        </span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-600">
          {script.version_count}{" "}
          {script.version_count === 1 ? "version" : "versions"}
        </span>
      </div>

      {/* Version Circles */}
      {sortedVersions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 relative">
          <div className="flex items-center" style={{ marginLeft: "-8px" }}>
            {visibleVersions.map((version, index) => {
              const versionColor = getVersionBadgeColor(version.version_number);
              return (
                <div
                  key={version.id}
                  className="relative transition-transform duration-200 hover:scale-125 hover:z-10 cursor-pointer"
                  style={{
                    marginLeft: index > 0 ? "-8px" : "0",
                    zIndex: visibleVersions.length - index,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Navigate to version detail page
                  }}
                  title={`Version ${version.version_number}${
                    version.has_uploaded_file ? " (Uploaded)" : ""
                  }${version.notes ? ` - ${version.notes}` : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-black shadow-sm bg-white"
                    style={{
                      color: colors.text.black,
                    }}
                  >
                    V{version.version_number}
                  </div>
                </div>
              );
            })}

            {/* "+X" Button for remaining versions */}
            {remainingCount > 0 && (
              <div className="relative" ref={remainingVersionsRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemainingVersions(!showRemainingVersions);
                  }}
                  className="relative transition-transform duration-200 hover:scale-125 hover:z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm bg-blue-500 hover:bg-blue-600"
                  style={{
                    marginLeft: "-8px",
                    zIndex: 10,
                  }}
                  title={`${remainingCount} more version${
                    remainingCount !== 1 ? "s" : ""
                  }`}
                >
                  +{remainingCount}
                </button>

                {/* Dropdown for remaining versions */}
                {showRemainingVersions && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                        Remaining Versions
                      </div>
                      {sortedVersions.slice(4).map((version) => {
                        const versionColor = getVersionBadgeColor(
                          version.version_number
                        );
                        return (
                          <button
                            key={version.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRemainingVersions(false);
                              // TODO: Navigate to version detail page
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded transition-colors text-left"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{
                                backgroundColor: versionColor.bg,
                                color: versionColor.text,
                              }}
                            >
                              V{version.version_number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  Version {version.version_number}
                                </div>
                                {version.has_uploaded_file && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs text-gray-500"
                                    title="Uploaded file"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                      />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {version.notes && (
                                <div className="text-xs text-gray-500 truncate">
                                  {version.notes}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end mt-4 border-t-2 border-gray-100 pt-4">
        <span
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
          style={{
            backgroundColor: statusStyles.bg,
            color: statusStyles.text,
            borderColor: statusStyles.border,
          }}
        >
          {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
        </span>
        <button className="text-xs font-bold uppercase hover:bg-black hover:text-white px-2 py-1 transition-colors">
          Open →
        </button>
      </div>
    </div>
  );
};

export default ScriptCard;
