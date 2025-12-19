/**
 * Theme Configuration
 * Central place for all color values and design tokens used throughout the application
 */

export const colors = {
  // Primary brand colors
  primary: {
    pink: "#F2556E",
    pinkDark: "#E0445D", // Darker shade for hover states
    pinkLight: "#FF6B85", // Lighter shade if needed
  },

  // Background colors
  background: {
    beige: "#F8F1E8",
    beigeAlt: "#f5f1e8", // Alternative beige shade
    white: "#FFFFFF",
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },

  // Text colors
  text: {
    black: "#000000",
    white: "#FFFFFF",
    gray: {
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
    },
  },

  // Status colors
  status: {
    green: "#10B981",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    red: "#EF4444",
  },
} as const;

/**
 * Tailwind color classes for use in className
 * These can be used with Tailwind's arbitrary value syntax
 */
export const tailwindColors = {
  primaryPink: `bg-[${colors.primary.pink}]`,
  primaryPinkDark: `bg-[${colors.primary.pinkDark}]`,
  primaryPinkBorder: `border-[${colors.primary.pink}]`,
  primaryPinkText: `text-[${colors.primary.pink}]`,
} as const;

/**
 * Helper function to get color value for inline styles
 */
export const getColor = (colorPath: string): string => {
  const keys = colorPath.split(".");
  let value: any = colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found`);
      return "#000000";
    }
  }

  return value;
};

/**
 * Helper function to get rgba color with opacity
 */
export const getColorWithOpacity = (
  colorPath: string,
  opacity: number
): string => {
  const color = getColor(colorPath);

  // Convert hex to rgb
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get status styles for script/project status badges
 * Returns background, text, and border colors based on status
 */
export const getStatusStyles = (
  status: string
): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (status.toLowerCase()) {
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

/**
 * Get version badge colors for script versions
 * Returns background and text colors based on version number
 * Different versions get different colors for visual distinction
 */
export const getVersionBadgeColor = (
  versionNumber: number | undefined | null
): {
  bg: string;
  text: string;
} => {
  const colors = [
    { bg: "#D1FAE5", text: "#065F46" }, // v1 - light green
    { bg: "#DBEAFE", text: "#1E40AF" }, // v2 - light blue
    { bg: "#FCE7F3", text: "#BE185D" }, // v3 - pink
    { bg: "#FEF3C7", text: "#92400E" }, // v4+ - yellow
  ];

  if (!versionNumber || versionNumber < 1) {
    return colors[0]; // Default to v1 color
  }

  const index = Math.min(versionNumber - 1, 3);
  return colors[index] || colors[0];
};
