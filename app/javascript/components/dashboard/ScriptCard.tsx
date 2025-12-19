import React from "react";
import { colors } from "../../lib/theme";
import type { Script } from "../../types/api";

interface ScriptCardProps {
  script: Script;
  projectTitle?: string;
  onClick?: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  projectTitle,
  onClick,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#ECFDF5", text: "#047857", border: "#10B981" };
      case "archived":
        return { bg: "#F9FAFB", text: "#6B7280", border: "#D1D5DB" };
      case "locked":
        return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
      default:
        return { bg: "#F9FAFB", text: "#6B7280", border: "#D1D5DB" };
    }
  };

  const statusStyles = getStatusColor(script.status);
  const formattedDate = new Date(script.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
          {script.version_count} {script.version_count === 1 ? "version" : "versions"}
        </span>
      </div>

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

