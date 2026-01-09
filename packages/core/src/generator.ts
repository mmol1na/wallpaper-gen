import chroma from "chroma-js";
import type {
  Canvas,
  CanvasContext,
  GeneratorOptions,
  ShapeConfig,
  WallpaperConfig,
} from "./types";
import { getPalette, PALETTES } from "./palettes";
import { createSeededRandom, randomRange, shuffleArray } from "./random";

export function generateShapeConfigs(options: GeneratorOptions): WallpaperConfig {
  const {
    width,
    height,
    palette,
    shapeCount,
    seed,
    shapeWidthRatio = 0.12,
    shapeHeightRatio = 0.75,
    overlapRatio = 0.35,
    backgroundColor: customBgColor,
  } = options;

  const random = createSeededRandom(seed);

  let colors: string[];
  let backgroundColor: string;
  let isGradientMode = false;

  if (typeof palette === "string") {
    const paletteData = getPalette(palette);
    if (!paletteData) {
      throw new Error(
        `Unknown palette: ${palette}. Available: ${Object.keys(PALETTES).join(", ")}`,
      );
    }
    colors = paletteData.colors;
    backgroundColor = paletteData.background;
  } else {
    colors = palette;
    backgroundColor = customBgColor || "#0a0a0a";
    isGradientMode = true;
  }

  const shapes: ShapeConfig[] = [];

  const shapeWidth = shapeWidthRatio;
  const shapeHeight = shapeHeightRatio;

  const effectiveWidth = shapeWidth * (1 - overlapRatio);
  const totalWidth = shapeWidth + (shapeCount - 1) * effectiveWidth;
  const startX = (1 - totalWidth) / 2;

  const y = (1 - shapeHeight) / 2;

  let colorScale: chroma.Scale | null = null;
  let shuffledColors: string[] = [];

  if (isGradientMode && colors.length >= 2) {
    colorScale = chroma.scale(colors).mode("lch");
  } else {
    shuffledColors = shuffleArray(random, colors);
  }

  for (let i = 0; i < shapeCount; i++) {
    let shapeColor: string;

    if (colorScale) {
      const t = shapeCount > 1 ? i / (shapeCount - 1) : 0.5;
      shapeColor = colorScale(t).hex();
    } else {
      const colorIndex = i % shuffledColors.length;
      shapeColor = shuffledColors[colorIndex];
    }

    const x = startX + i * effectiveWidth;

    shapes.push({
      widthRatio: shapeWidth,
      heightRatio: shapeHeight,
      x: x,
      y: y,
      color: shapeColor,
      borderRadius: Math.min(shapeWidth * width, shapeHeight * height) / 2,
    });
  }

  return {
    width,
    height,
    backgroundColor,
    palette: colors,
    shapes,
    seed,
  };
}

export function renderWallpaper(canvas: Canvas, config: WallpaperConfig): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2d context from canvas");
  }

  const { width, height, backgroundColor, shapes } = config;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    const x = shape.x * width;
    const y = shape.y * height;
    const w = shape.widthRatio * width;
    const h = shape.heightRatio * height;
    const radius = shape.borderRadius ?? Math.min(w, h) / 2;

    ctx.fillStyle = shape.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }
}

export function generateWallpaper(canvas: Canvas, options: GeneratorOptions): WallpaperConfig {
  const config = generateShapeConfigs(options);
  renderWallpaper(canvas, config);
  return config;
}

export function generateRandomPalette(count: number = 7, seed?: number): string[] {
  const random = createSeededRandom(seed);
  const baseHue = random() * 360;

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360) / count + randomRange(random, -20, 20)) % 360;
    const saturation = randomRange(random, 0.5, 0.9);
    const lightness = randomRange(random, 0.5, 0.7);

    colors.push(chroma.hsl(hue, saturation, lightness).hex());
  }

  return shuffleArray(random, colors);
}

export function generateComplementaryPalette(baseColor: string, count: number = 7): string[] {
  const base = chroma(baseColor);
  const baseHue = base.get("hsl.h") || 0;

  return chroma
    .scale([base.set("hsl.h", baseHue), base.set("hsl.h", (baseHue + 180) % 360)])
    .mode("lch")
    .colors(count);
}

export function generateAnalogousPalette(baseColor: string, count: number = 7): string[] {
  const base = chroma(baseColor);
  const baseHue = base.get("hsl.h") || 0;

  return chroma
    .scale([
      base.set("hsl.h", (baseHue - 30) % 360),
      base.set("hsl.h", baseHue),
      base.set("hsl.h", (baseHue + 30) % 360),
    ])
    .mode("lch")
    .colors(count);
}

export function getContrastingBackground(colors: string[]): string {
  const avgLuminance = colors.reduce((sum, c) => sum + chroma(c).luminance(), 0) / colors.length;
  return avgLuminance > 0.5 ? "#1e1e2e" : "#f5f5f5";
}
