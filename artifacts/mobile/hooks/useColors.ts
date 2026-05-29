import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * NutriLens is a dark-only app — always returns the dark palette.
 */
export function useColors() {
  const palette = (colors as Record<string, unknown>).dark as typeof colors.light;
  return { ...palette, radius: colors.radius };
}
