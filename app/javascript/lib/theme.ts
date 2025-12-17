/**
 * Theme Configuration
 * Central place for all color values and design tokens used throughout the application
 */

export const colors = {
  // Primary brand colors
  primary: {
    pink: '#F2556E',
    pinkDark: '#E0445D', // Darker shade for hover states
    pinkLight: '#FF6B85', // Lighter shade if needed
  },
  
  // Background colors
  background: {
    beige: '#F8F1E8',
    beigeAlt: '#f5f1e8', // Alternative beige shade
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  // Text colors
  text: {
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
    },
  },
  
  // Status colors
  status: {
    green: '#10B981',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    red: '#EF4444',
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
  const keys = colorPath.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found`);
      return '#000000';
    }
  }
  
  return value;
};

/**
 * Helper function to get rgba color with opacity
 */
export const getColorWithOpacity = (colorPath: string, opacity: number): string => {
  const color = getColor(colorPath);
  
  // Convert hex to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

