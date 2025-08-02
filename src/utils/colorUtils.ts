// src/utils/colorUtils.ts

export interface ColorVariations {
  bg: string;
  text: string;
  hover: string;
}

/**
 * Converts a hex color to various color variations for UI components
 * @param color - Hex color string (e.g., "#ff0000")
 * @returns Object containing background, text, and hover color variations
 */
export const getColorVariations = (color: string): ColorVariations => {
  // Convert hex to RGB if needed
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgb = hexToRgb(color);
  if (!rgb) return { bg: color, text: "#000", hover: color };

  // Create lighter background (equivalent to -100)
  const bg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  // Create darker text (equivalent to -800)
  const text = `rgb(${Math.max(0, rgb.r - 100)}, ${Math.max(
    0,
    rgb.g - 100
  )}, ${Math.max(0, rgb.b - 100)})`;

  // Create hover color (equivalent to -200)
  const hover = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  return { bg, text, hover };
};

/**
 * Checks if a color string is a valid hex color
 * @param color - Color string to validate
 * @returns Boolean indicating if the color is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;
  return hexRegex.test(color);
};

/**
 * Converts RGB values to hex color
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (value: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Gets a contrasting text color (black or white) based on background color
 * @param backgroundColor - Background color in hex format
 * @returns Either "#000000" or "#ffffff" for optimal contrast
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(backgroundColor);

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? "#000000" : "#ffffff";
};
