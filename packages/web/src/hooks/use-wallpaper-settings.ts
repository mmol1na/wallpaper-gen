import { useState, useEffect, useCallback } from "react";
import type { ResolutionPreset } from "@wallpaper-gen/core";

const STORAGE_KEY = "wallpaper-gen-settings";
const STORAGE_VERSION = 1;

export type GeneratorMode = "gradient" | "themes";

export interface WallpaperGeneratorState {
  mode: GeneratorMode;
  palette: string;
  customColors: string[];
  backgroundColor: string;
  resolution: ResolutionPreset;
  shapeCount: number;
  shapeWidth: number;
  shapeHeight: number;
  overlap: number;
  seed?: number;
}

export const DEFAULT_STATE: WallpaperGeneratorState = {
  mode: "gradient",
  palette: "catppuccinMocha",
  customColors: ["#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#eab308"],
  backgroundColor: "#212121",
  resolution: "4k",
  shapeCount: 7,
  shapeWidth: 12,
  shapeHeight: 75,
  overlap: 35,
  seed: undefined,
};

interface StoredSettings {
  version: number;
  state: WallpaperGeneratorState;
}

const VALID_RESOLUTIONS = ["hd", "fhd", "qhd", "4k", "ultrawide", "mobile"];
const URL_PARAM_KEYS = ["m", "r", "s", "w", "h", "o", "c", "bg", "p", "seed"];

function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function parseNumberInRange(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max ? num : null;
}

function parseUrlParams(search: string): Partial<WallpaperGeneratorState> | null {
  if (!search) return null;

  const params = new URLSearchParams(search);
  const hasParams = URL_PARAM_KEYS.some((key) => params.has(key));
  if (!hasParams) return null;

  const parsed: Partial<WallpaperGeneratorState> = {};

  const mode = params.get("m");
  if (mode === "gradient" || mode === "themes") {
    parsed.mode = mode;
  }

  const resolution = params.get("r");
  if (resolution && VALID_RESOLUTIONS.includes(resolution)) {
    parsed.resolution = resolution as ResolutionPreset;
  }

  const shapeCount = parseNumberInRange(params.get("s"), 3, 15);
  if (shapeCount) parsed.shapeCount = shapeCount;

  const shapeWidth = parseNumberInRange(params.get("w"), 5, 25);
  if (shapeWidth) parsed.shapeWidth = shapeWidth;

  const shapeHeight = parseNumberInRange(params.get("h"), 40, 95);
  if (shapeHeight) parsed.shapeHeight = shapeHeight;

  const overlap = parseNumberInRange(params.get("o"), 0, 60);
  if (overlap !== null) parsed.overlap = overlap;

  const colors = params.get("c");
  if (colors) {
    const colorArray = colors.split(",").filter(isValidHexColor);
    if (colorArray.length >= 2 && colorArray.length <= 10) {
      parsed.customColors = colorArray;
    }
  }

  const bgColor = params.get("bg");
  if (bgColor && isValidHexColor(bgColor)) {
    parsed.backgroundColor = bgColor;
  }

  const palette = params.get("p");
  if (palette) {
    parsed.palette = palette;
  }

  const seed = params.get("seed");
  if (seed) {
    const num = parseInt(seed, 10);
    if (!isNaN(num)) parsed.seed = num;
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
}

function loadFromStorage(): WallpaperGeneratorState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredSettings = JSON.parse(stored);

    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      ...DEFAULT_STATE,
      ...parsed.state,
      customColors:
        Array.isArray(parsed.state.customColors) && parsed.state.customColors.length >= 2
          ? parsed.state.customColors
          : DEFAULT_STATE.customColors,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveToStorage(state: WallpaperGeneratorState): void {
  try {
    const toStore: StoredSettings = {
      version: STORAGE_VERSION,
      state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    console.warn("Failed to save settings to localStorage");
  }
}

function clearUrlParams(): void {
  if (typeof window !== "undefined" && window.history.replaceState) {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

export function useWallpaperSettings() {
  const [state, setState] = useState<WallpaperGeneratorState>(() => ({
    ...DEFAULT_STATE,
    seed: Date.now(),
  }));
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const urlState = parseUrlParams(window.location.search);
    if (urlState) {
      const merged = { ...DEFAULT_STATE, ...urlState };
      if (!merged.seed) merged.seed = Date.now();
      clearUrlParams();
      setState(merged);
      setInitialized(true);
      return;
    }

    const storedState = loadFromStorage();
    if (storedState) {
      setState({ ...storedState, seed: Date.now() });
    }
    setInitialized(true);
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;
    const { seed: _, ...stateWithoutSeed } = state;
    saveToStorage({ ...stateWithoutSeed, seed: undefined });
  }, [state, initialized]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...DEFAULT_STATE, seed: Date.now() });
  }, []);

  return {
    state,
    setState,
    resetToDefaults,
  };
}
