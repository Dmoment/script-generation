import React from "react";
import { colors } from "../../lib/theme";

interface SidebarItemProps {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
}

/**
 * Sidebar Item Component
 *
 * @param label - The text label to display (e.g., "Overview", "Script Database")
 * @param active - Boolean indicating if this is the currently selected/active menu item
 *                 When active=true: shows pink background (colors.primary.pink) with white text and left border
 *                 When active=false: shows gray text, becomes black on hover
 * @param icon - Optional React icon component to display next to the label
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  active = false,
  icon,
}) => (
  <div
    className={`group/item flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase tracking-wide transition-all duration-200 border-l-4 ${
      active
        ? "text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-black border-transparent hover:border-gray-300"
    }`}
    style={
      active
        ? {
            backgroundColor: colors.primary.pink,
            borderColor: colors.primary.pink,
          }
        : {}
    }
  >
    {/* Icon container - always visible */}
    <div
      className={`flex h-5 w-5 items-center justify-center flex-shrink-0 ${
        active ? "text-white" : "text-gray-400 group-hover/item:text-black"
      }`}
    >
      {icon || (
        <div
          className={`h-2 w-2 bg-current ${active ? "animate-pulse" : ""}`}
        ></div>
      )}
    </div>
    {/* Label - hidden when collapsed, shown when sidebar is hovered */}
    <span className="sidebar-label whitespace-nowrap transition-all duration-300 inline-block opacity-0 ml-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-[180px] group-hover/sidebar:ml-2">
      {label}
    </span>
  </div>
);

export default SidebarItem;
