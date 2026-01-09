/**
 * Core types for wallpaper generation
 */

export interface PaletteDefinition {
  name: string;
  displayName: string;
  colors: string[];
  background: string;
  accent?: string;
}

export interface ShapeConfig {
  /** Width as percentage of canvas width (0-1) */
  widthRatio: number;
  /** Height as percentage of canvas height (0-1) */
  heightRatio: number;
  /** X position as percentage of canvas width (0-1) */
  x: number;
  /** Y position as percentage of canvas height (0-1) */
  y: number;
  /** Color from palette */
  color: string;
  /** Border radius for pill shape */
  borderRadius?: number;
}

export interface WallpaperConfig {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Background color (hex) */
  backgroundColor: string;
  /** Array of colors for shapes */
  palette: string[];
  /** Shape configurations */
  shapes: ShapeConfig[];
  /** Random seed for reproducibility */
  seed?: number;
}

export interface GeneratorOptions {
  width: number;
  height: number;
  palette: string | string[];
  shapeCount: number;
  seed?: number;
  shapeWidthRatio?: number;
  shapeHeightRatio?: number;
  overlapRatio?: number;
  backgroundColor?: string;
}

export interface CanvasContext {
  fillStyle: string;
  beginPath(): void;
  roundRect(x: number, y: number, w: number, h: number, radii: number): void;
  fill(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
}

export interface Canvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasContext | null;
  toDataURL(type?: string, quality?: number): string;
  toBlob?(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export type ResolutionPreset = 'hd' | 'fhd' | 'qhd' | '4k' | 'ultrawide' | 'mobile';

export const RESOLUTION_PRESETS: Record<ResolutionPreset, { width: number; height: number; label: string }> = {
  hd: { width: 1280, height: 720, label: 'HD (1280x720)' },
  fhd: { width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
  qhd: { width: 2560, height: 1440, label: 'QHD (2560x1440)' },
  '4k': { width: 3840, height: 2160, label: '4K (3840x2160)' },
  ultrawide: { width: 3440, height: 1440, label: 'Ultrawide (3440x1440)' },
  mobile: { width: 1080, height: 1920, label: 'Mobile (1080x1920)' },
};
