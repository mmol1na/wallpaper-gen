import { useState, useCallback, useMemo } from "react";
import {
  RESOLUTION_PRESETS,
  type ResolutionPreset,
  type GeneratorOptions,
  type WallpaperConfig,
  getAllPalettes,
} from "@wallpaper-gen/core";
import { useWallpaperCanvas } from "@/hooks/use-wallpaper-canvas";
import { WallpaperCanvas } from "./wallpaper-canvas";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type GeneratorMode = "gradient" | "themes";

interface WallpaperGeneratorState {
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

export function WallpaperGenerator() {
  const [state, setState] = useState<WallpaperGeneratorState>({
    mode: "gradient",
    palette: "catppuccinMocha",
    customColors: ["#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#eab308"],
    backgroundColor: "#212121",
    resolution: "4k",
    shapeCount: 7,
    shapeWidth: 12,
    shapeHeight: 75,
    overlap: 35,
    seed: Date.now(),
  });

  const [config, setConfig] = useState<WallpaperConfig | null>(null);

  const options: GeneratorOptions = useMemo(
    () => ({
      width: RESOLUTION_PRESETS[state.resolution].width,
      height: RESOLUTION_PRESETS[state.resolution].height,
      palette: state.mode === "gradient" ? state.customColors : state.palette,
      shapeCount: state.shapeCount,
      shapeWidthRatio: state.shapeWidth / 100,
      shapeHeightRatio: state.shapeHeight / 100,
      overlapRatio: state.overlap / 100,
      seed: state.seed,
      ...(state.mode === "gradient" && { backgroundColor: state.backgroundColor }),
    }),
    [state],
  );

  const { canvasRef, downloadPng } = useWallpaperCanvas({
    options,
    onConfigGenerated: setConfig,
  });

  const handleRandomize = useCallback(() => {
    setState((prev) => ({ ...prev, seed: Date.now() }));
  }, []);

  const handleShare = useCallback(() => {
    const params = new URLSearchParams({
      m: state.mode,
      r: state.resolution,
      s: String(state.shapeCount),
      w: String(state.shapeWidth),
      h: String(state.shapeHeight),
      o: String(state.overlap),
      ...(state.mode === "gradient"
        ? {
            c: state.customColors.join(","),
            bg: state.backgroundColor,
          }
        : { p: state.palette }),
      ...(state.seed && { seed: String(state.seed) }),
    });
    const url = `${window.location.origin}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  }, [state]);

  const handleDownload = useCallback(() => {
    const name = state.mode === "gradient" ? "GRADIENT" : state.palette.toUpperCase();
    const filename = `WP_${name}_${state.resolution.toUpperCase()}_${state.seed || Date.now()}.png`;
    downloadPng(filename);
  }, [downloadPng, state.mode, state.palette, state.resolution, state.seed]);

  const palettes = getAllPalettes();

  const handleAddColor = useCallback(() => {
    if (state.customColors.length < 10) {
      const hue = Math.floor(Math.random() * 360);
      const newColor = `hsl(${hue}, 70%, 50%)`;
      setState((prev) => ({ ...prev, customColors: [...prev.customColors, newColor] }));
    }
  }, [state.customColors.length]);

  const handleRemoveColor = useCallback(
    (index: number) => {
      if (state.customColors.length > 2) {
        setState((prev) => ({
          ...prev,
          customColors: prev.customColors.filter((_, i) => i !== index),
        }));
      }
    },
    [state.customColors.length],
  );

  const handleColorChange = useCallback((index: number, color: string) => {
    setState((prev) => ({
      ...prev,
      customColors: prev.customColors.map((c, i) => (i === index ? color : c)),
    }));
  }, []);

  return (
    <div className="h-screen bg-background p-3 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-medium tracking-wider">wallpaper-gen</h1>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {config && (
            <span className="text-primary">
              {options.width}×{options.height}
            </span>
          )}
          <span className="mx-2">•</span>
          <span>{state.shapeCount} SHAPES</span>
        </div>
      </header>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 border border-border bg-black/30 flex items-center justify-center p-2 min-h-0 rounded-md">
            <WallpaperCanvas
              ref={canvasRef}
              width={options.width}
              height={options.height}
              className="max-w-full max-h-full object-contain "
            />
          </div>

          <div className="mt-2 flex items-center gap-2 shrink-0">
            <Button variant="hud" size="hud" onClick={handleRandomize} className="flex-1">
              RANDOMIZE <kbd className="ml-1 opacity-50">R</kbd>
            </Button>
            <Button variant="hud" size="hud" onClick={handleShare} className="flex-1">
              COPY LINK <kbd className="ml-1 opacity-50">C</kbd>
            </Button>
            <Button variant="hud-primary" size="hud" onClick={handleDownload} className="flex-1">
              EXPORT <kbd className="ml-1 opacity-50">E</kbd>
            </Button>
          </div>
        </div>

        <div className="w-72 shrink-0 flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 gap-1">
            {(["gradient", "themes"] as const).map((mode) => (
              <Button
                key={mode}
                variant={state.mode === mode ? "hud-primary" : "hud"}
                size="hud"
                onClick={() => setState((prev) => ({ ...prev, mode, seed: Date.now() }))}
              >
                {mode}
              </Button>
            ))}
          </div>

          <Panel title="RESOLUTION" compact>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(RESOLUTION_PRESETS) as ResolutionPreset[]).map((key) => (
                <Button
                  key={key}
                  variant={state.resolution === key ? "hud-primary" : "hud"}
                  size="hud-sm"
                  onClick={() => setState((prev) => ({ ...prev, resolution: key }))}
                  className={state.resolution !== key ? "border-border/50 hover:border-border" : ""}
                >
                  {key}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="SHAPE SETTINGS" compact>
            <div className="space-y-3">
              <SliderControl
                label="COUNT"
                value={state.shapeCount}
                min={3}
                max={15}
                onChange={(v) => setState((prev) => ({ ...prev, shapeCount: v, seed: Date.now() }))}
              />
              <SliderControl
                label="WIDTH"
                value={state.shapeWidth}
                min={5}
                max={25}
                suffix="%"
                onChange={(v) => setState((prev) => ({ ...prev, shapeWidth: v }))}
              />
              <SliderControl
                label="HEIGHT"
                value={state.shapeHeight}
                min={40}
                max={95}
                suffix="%"
                onChange={(v) => setState((prev) => ({ ...prev, shapeHeight: v }))}
              />
              <SliderControl
                label="OVERLAP"
                value={state.overlap}
                min={0}
                max={60}
                suffix="%"
                onChange={(v) => setState((prev) => ({ ...prev, overlap: v }))}
              />
            </div>
          </Panel>

          {state.mode === "gradient" ? (
            <Panel title="COLORS" className="flex-1 min-h-0 flex flex-col" compact>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="text-[9px] text-muted-foreground w-14 shrink-0">BG</span>
                  <input
                    type="color"
                    value={state.backgroundColor}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, backgroundColor: e.target.value }))
                    }
                    className="w-6 h-6 border border-border bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {state.backgroundColor.toUpperCase()}
                  </span>
                </div>

                {state.customColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-14 shrink-0">
                      COLOR {index + 1}
                    </span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-6 h-6 border border-border bg-transparent cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono flex-1">
                      {color.toUpperCase()}
                    </span>
                    {state.customColors.length > 2 && (
                      <Button
                        variant="hud-ghost"
                        size="hud-sm"
                        onClick={() => handleRemoveColor(index)}
                        className="hover:text-critical px-1"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}

                {state.customColors.length < 10 && (
                  <Button
                    variant="hud-dashed"
                    size="hud"
                    onClick={handleAddColor}
                    className="w-full"
                  >
                    + ADD COLOR
                  </Button>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="PALETTE" className="flex-1 min-h-0 flex flex-col" compact>
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 -mr-1 scrollbar-thin">
                {palettes.map((palette) => (
                  <Button
                    key={palette.name}
                    variant="ghost"
                    onClick={() =>
                      setState((prev) => ({ ...prev, palette: palette.name, seed: Date.now() }))
                    }
                    className={cn(
                      "w-full flex items-center gap-2 p-1.5 border h-auto justify-start text-left group rounded-none",
                      "hover:bg-muted/30",
                      state.palette === palette.name
                        ? "bg-primary/10 border-primary"
                        : "border-transparent hover:border-border/50",
                    )}
                  >
                    <div className="flex gap-px shrink-0">
                      {palette.colors.slice(0, 6).map((color, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-5 transition-transform duration-150 group-hover/button:scale-y-110"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-[9px] uppercase tracking-wider truncate transition-colors duration-150",
                          state.palette === palette.name
                            ? "text-primary"
                            : "text-foreground/80 group-hover/button:text-foreground",
                        )}
                      >
                        {palette.displayName}
                      </div>
                    </div>
                    {state.palette === palette.name && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </Button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 min-w-0 h-1 bg-border rounded-md appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 
          [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2
          [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-none
          [&::-moz-range-track]:bg-border [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-md"
      />
      <span className="text-xs font-medium text-primary w-10 shrink-0 text-right">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function Panel({
  title,
  children,
  className,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const isFlexCol = className?.includes("flex-col");
  return (
    <div className={cn("border border-border bg-card/50 rounded-md ", className)}>
      <div
        className={cn(
          "border-b border-border bg-muted/30 shrink-0",
          compact ? "px-2 py-1" : "px-3 py-2",
        )}
      >
        <h2 className="text-[9px] font-medium tracking-wider uppercase text-muted-foreground">
          {title}
        </h2>
      </div>
      <div
        className={cn(
          compact ? "p-2" : "p-3",
          isFlexCol && "flex-1 min-h-0 overflow-hidden flex flex-col",
        )}
      >
        {children}
      </div>
    </div>
  );
}
