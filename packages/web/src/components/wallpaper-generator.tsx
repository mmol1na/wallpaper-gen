import { useState, useCallback, useMemo } from 'react';
import { 
  RESOLUTION_PRESETS, 
  type ResolutionPreset, 
  type GeneratorOptions, 
  type WallpaperConfig,
  getAllPalettes,
} from '@wallpaper-gen/core';
import { useWallpaperCanvas } from '@/hooks/use-wallpaper-canvas';
import { WallpaperCanvas } from './wallpaper-canvas';
import { cn } from '@/lib/utils';

type GeneratorMode = 'gradient' | 'themes';

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
    mode: 'gradient',
    palette: 'catppuccinMocha',
    customColors: ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308'],
    backgroundColor: '#0a0a0a',
    resolution: 'fhd',
    shapeCount: 7,
    shapeWidth: 12,
    shapeHeight: 75,
    overlap: 35,
    seed: Date.now(),
  });

  const [config, setConfig] = useState<WallpaperConfig | null>(null);

  const options: GeneratorOptions = useMemo(() => ({
    width: RESOLUTION_PRESETS[state.resolution].width,
    height: RESOLUTION_PRESETS[state.resolution].height,
    palette: state.mode === 'gradient' ? state.customColors : state.palette,
    shapeCount: state.shapeCount,
    shapeWidthRatio: state.shapeWidth / 100,
    shapeHeightRatio: state.shapeHeight / 100,
    overlapRatio: state.overlap / 100,
    seed: state.seed,
    ...(state.mode === 'gradient' && { backgroundColor: state.backgroundColor }),
  }), [state]);

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
      ...(state.mode === 'gradient' 
        ? { 
            c: state.customColors.join(','),
            bg: state.backgroundColor,
          }
        : { p: state.palette }
      ),
      ...(state.seed && { seed: String(state.seed) }),
    });
    const url = `${window.location.origin}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  }, [state]);

  const handleDownload = useCallback(() => {
    const name = state.mode === 'gradient' ? 'GRADIENT' : state.palette.toUpperCase();
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

  const handleRemoveColor = useCallback((index: number) => {
    if (state.customColors.length > 2) {
      setState((prev) => ({
        ...prev,
        customColors: prev.customColors.filter((_, i) => i !== index),
      }));
    }
  }, [state.customColors.length]);

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
          <h1 className="text-xs font-medium tracking-wider uppercase">WALLPAPER-GEN</h1>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <StatusIndicator status="nominal" label="SYS" />
            <StatusIndicator status="nominal" label="RENDER" />
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {config && <span className="text-primary">{options.width}×{options.height}</span>}
          <span className="mx-2">•</span>
          <span>{state.shapeCount} SHAPES</span>
        </div>
      </header>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 border border-border bg-black/30 flex items-center justify-center p-2 min-h-0">
            <WallpaperCanvas
              ref={canvasRef}
              width={options.width}
              height={options.height}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="mt-2 flex items-center gap-2 shrink-0">
            <button
              onClick={handleRandomize}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border 
                text-muted-foreground hover:border-primary/50 hover:text-foreground 
                transition-all duration-150 active:scale-[0.98]"
            >
              RANDOMIZE <kbd className="ml-1 opacity-50">R</kbd>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border 
                text-muted-foreground hover:border-primary/50 hover:text-foreground 
                transition-all duration-150 active:scale-[0.98]"
            >
              COPY LINK <kbd className="ml-1 opacity-50">C</kbd>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-primary 
                bg-primary/20 text-primary hover:bg-primary/30 
                transition-all duration-150 active:scale-[0.98]"
            >
              EXPORT <kbd className="ml-1 opacity-50">E</kbd>
            </button>
            
            {config && (
              <div className="px-2 py-1 text-[10px] text-muted-foreground border border-border/50 bg-muted/30">
                #{String(config.seed || 0).slice(-6)}
              </div>
            )}
          </div>
        </div>

        <div className="w-72 shrink-0 flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 gap-1">
            {(['gradient', 'themes'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setState((prev) => ({ ...prev, mode, seed: Date.now() }))}
                className={cn(
                  'px-2 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-150',
                  state.mode === mode
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <Panel title="RESOLUTION" compact>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(RESOLUTION_PRESETS) as ResolutionPreset[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setState((prev) => ({ ...prev, resolution: key }))}
                  className={cn(
                    'px-1 py-1 text-[9px] uppercase tracking-wider border transition-all duration-150',
                    state.resolution === key
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {key}
                </button>
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

          {state.mode === 'gradient' ? (
            <Panel title="COLORS" className="flex-1 min-h-0 flex flex-col" compact>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="text-[9px] text-muted-foreground w-14 shrink-0">BG</span>
                  <input
                    type="color"
                    value={state.backgroundColor}
                    onChange={(e) => setState((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-6 h-6 border border-border bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">{state.backgroundColor.toUpperCase()}</span>
                </div>
                
                {state.customColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-14 shrink-0">COLOR {index + 1}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-6 h-6 border border-border bg-transparent cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono flex-1">{color.toUpperCase()}</span>
                    {state.customColors.length > 2 && (
                      <button
                        onClick={() => handleRemoveColor(index)}
                        className="text-[10px] text-muted-foreground hover:text-critical transition-colors px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                {state.customColors.length < 10 && (
                  <button
                    onClick={handleAddColor}
                    className="w-full py-1.5 text-[10px] uppercase tracking-wider border border-dashed border-border 
                      text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-150"
                  >
                    + ADD COLOR
                  </button>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="PALETTE" className="flex-1 min-h-0 flex flex-col" compact>
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 -mr-1 scrollbar-thin">
                {palettes.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setState((prev) => ({ ...prev, palette: palette.name, seed: Date.now() }))}
                    className={cn(
                      'w-full flex items-center gap-2 p-1.5 border transition-all duration-150 text-left group',
                      state.palette === palette.name
                        ? 'bg-primary/10 border-primary'
                        : 'border-transparent hover:border-border/50 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex gap-px shrink-0">
                      {palette.colors.slice(0, 6).map((color, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-5 transition-transform duration-150 group-hover:scale-y-110"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-[9px] uppercase tracking-wider truncate transition-colors duration-150',
                        state.palette === palette.name ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                      )}>
                        {palette.displayName}
                      </div>
                    </div>
                    {state.palette === palette.name && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </button>
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
  suffix = '',
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
        className="flex-1 h-1 bg-border rounded-none appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 
          [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
      <span className="text-xs font-medium text-primary w-10 text-right">{value}{suffix}</span>
    </div>
  );
}

function Panel({ 
  title, 
  children, 
  className,
  compact = false
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  compact?: boolean;
}) {
  const isFlexCol = className?.includes('flex-col');
  return (
    <div className={cn('border border-border bg-card/50', className)}>
      <div className={cn('border-b border-border bg-muted/30 shrink-0', compact ? 'px-2 py-1' : 'px-3 py-2')}>
        <h2 className="text-[9px] font-medium tracking-wider uppercase text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className={cn(
        compact ? 'p-2' : 'p-3',
        isFlexCol && 'flex-1 min-h-0 overflow-hidden flex flex-col'
      )}>
        {children}
      </div>
    </div>
  );
}

function StatusIndicator({ status, label }: { status: 'nominal' | 'warning' | 'critical'; label: string }) {
  const colors = {
    nominal: 'bg-nominal',
    warning: 'bg-warning',
    critical: 'bg-critical',
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', colors[status])} />
      <span>{label}</span>
    </div>
  );
}
