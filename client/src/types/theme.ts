/**
 * Color theme type definitions for the application
 */

export interface ColorTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name of the theme */
  name: string;
  /** Optional description */
  description?: string;
  /** Color configuration */
  colors: ThemeColors;
  /** Whether this is a built-in preset theme */
  isPreset: boolean;
  /** When the theme was created */
  createdAt: string;
}

export interface ThemeColors {
  // Canvas Colors
  /** Background color of the canvas */
  canvasBackground: string;
  /** Grid line color */
  canvasGrid: string;

  // Node Colors
  /** Default node background */
  nodeBackground: string;
  /** Default node border */
  nodeBorder: string;
  /** Node text color */
  nodeText: string;
  /** Secondary text (metadata, etc.) */
  nodeSecondaryText: string;

  // Edge Colors
  /** Default edge stroke color */
  edgeStroke: string;
  /** Edge label text color */
  edgeLabel: string;
  /** Selected edge color */
  edgeSelected: string;

  // UI Colors
  /** Primary brand color */
  primary: string;
  /** Secondary brand color */
  secondary: string;
  /** Accent color */
  accent: string;
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Error state color */
  error: string;

  // Tag Colors
  /** Array of colors for tag chips */
  tagColors: string[];
}

export interface NodeColorOverride {
  /** Node ID this override applies to */
  nodeId: string;
  /** Override background color */
  background?: string;
  /** Override border color */
  border?: string;
  /** Override text color */
  text?: string;
}
