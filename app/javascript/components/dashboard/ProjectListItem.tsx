import React from "react";
import { colors } from "../../lib/theme";

interface ProjectListItemProps {
  projectId: number | string;
  title: string;
  date: string;
  status?: "Active" | "Completed" | "Draft";
  projectType?: string;
  updatedAt?: string;
  createdAt?: string;
  isSelected?: boolean;
  onSelect?: (id: number | string, selected: boolean) => void;
  onDelete?: () => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({
  projectId,
  title,
  date,
  status = "Active",
  projectType,
  updatedAt,
  createdAt,
  isSelected = false,
  onSelect,
  onDelete,
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case "Active":
        return {
          bg: "#ECFDF5",
          text: "#047857",
          border: "#10B981",
        };
      case "Completed":
        return {
          bg: "#EFF6FF",
          text: "#1E40AF",
          border: "#3B82F6",
        };
      default:
        return {
          bg: "#F9FAFB",
          text: "#6B7280",
          border: "#D1D5DB",
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div
      className={`group bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
        isSelected ? "bg-pink-50" : ""
      }`}
    >
      <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 items-center">
        {/* Checkbox Column */}
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(projectId, e.target.checked)}
            className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
            style={{ accentColor: colors.primary.pink }}
          />
        </div>

        {/* Title Column */}
        <div className="col-span-4 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 group-hover:text-black truncate">
            {title}
          </h3>
        </div>

        {/* Type Column */}
        <div className="col-span-2">
          <span className="text-sm text-gray-600">{projectType || "—"}</span>
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
            {status}
          </span>
        </div>

        {/* Updated Date Column */}
        <div className="col-span-2">
          <span className="text-sm text-gray-500">{date}</span>
        </div>

        {/* Actions Column */}
        <div className="col-span-1 flex justify-end gap-2">
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-gray-700 hover:text-black transition-colors px-2 py-1"
          >
            Open →
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors px-2 py-1"
              title="Delete project"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectListItem;
