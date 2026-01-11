// DailyLoop Design System - Monochromatic Theme
// Light Mode: Clean, minimal, grayscale-based
// Dark Mode: Dark gray scale, high contrast text

export const lightTheme = {
  colors: {
    // Base
    background: "#FFFFFF",
    foreground: "#F9FAFB",
    card: "#FFFFFF",
    muted: "#F3F4F6",

    // Text
    text: {
      primary: "#111827",
      secondary: "#4B5563",
      tertiary: "#9CA3AF",
      inverse: "#FFFFFF",
      muted: "#9CA3AF",
    },

    // Brand
    primary: "#000000",
    primaryForeground: "#FFFFFF",
    accent: "#007AFF",
    accentForeground: "#FFFFFF",

    // Semantic
    success: "#10B981",
    successForeground: "#FFFFFF",
    warning: "#F59E0B",
    warningForeground: "#000000",
    error: "#EF4444",
    errorForeground: "#FFFFFF",
    info: "#007AFF",
    infoForeground: "#FFFFFF",

    // Grayscale Scale (50-950)
    grayscale: {
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
      950: "#030712",
    },

    // UI
    border: "#E5E7EB",
    divider: "#E5E7EB",
    overlay: "rgba(0, 0, 0, 0.5)",

    // Interactive
    hover: {
      background: "#F3F4F6",
      border: "#D1D5DB",
    },
    active: {
      background: "#E5E7EB",
      border: "#9CA3AF",
    },
  },

  // Spacing system (4pt grid)
  spacing: (multiplier: number) => multiplier * 4,

  // Border radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Typography
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },

  fontFamily: {
    thin: "Poppins-Thin",
    extralight: "Poppins-ExtraLight",
    light: "Poppins-Light",
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
    extrabold: "Poppins-ExtraBold",
    black: "Poppins-Black",
  },

  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    "2xl": 48,
  },
} as const;

export const darkTheme = {
  colors: {
    // Base
    background: "#000000",
    foreground: "#111827",
    card: "#1F2937",
    muted: "#374151",

    // Text
    text: {
      primary: "#FFFFFF",
      secondary: "#D1D5DB",
      tertiary: "#8E8E93",
      inverse: "#000000",
      muted: "#8E8E93",
    },

    // Brand
    primary: "#FFFFFF",
    primaryForeground: "#000000",
    accent: "#007AFF",
    accentForeground: "#FFFFFF",

    // Semantic
    success: "#10B981",
    successForeground: "#000000",
    warning: "#F59E0B",
    warningForeground: "#000000",
    error: "#EF4444",
    errorForeground: "#000000",
    info: "#007AFF",
    infoForeground: "#FFFFFF",

    // Grayscale Scale (100-1000)
    grayscale: {
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
      950: "#030712",
      1000: "#000000",
    },

    // UI
    border: "#38383A",
    divider: "#38383A",
    overlay: "rgba(0, 0, 0, 0.7)",

    // Interactive
    hover: {
      background: "#374151",
      border: "#4B5563",
    },
    active: {
      background: "#4B5563",
      border: "#6B7280",
    },
  },

  // Spacing system (4pt grid)
  spacing: (multiplier: number) => multiplier * 4,

  // Border radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Typography
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },

  fontFamily: {
    thin: "Poppins-Thin",
    extralight: "Poppins-ExtraLight",
    light: "Poppins-Light",
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
    extrabold: "Poppins-ExtraBold",
    black: "Poppins-Black",
  },

  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    "2xl": 48,
  },
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export type Theme = typeof lightTheme;
