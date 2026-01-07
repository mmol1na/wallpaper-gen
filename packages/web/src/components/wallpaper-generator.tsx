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

interface WallpaperGeneratorState {
  palette: string;
  resolution: ResolutionPreset;
  shapeCount: number;
  seed?: number;
}

export function WallpaperGenerator() {
  const [state, setState] = useState<WallpaperGeneratorState>({
    palette: 'catppuccinMocha',
    resolution: 'fhd',
    shapeCount: 7,
    seed: Date.now(),
  });

  const [config, setConfig] = useState<WallpaperConfig | null>(null);

  const options: GeneratorOptions = useMemo(() => ({
    width: RESOLUTION_PRESETS[state.resolution].width,
    height: RESOLUTION_PRESETS[state.resolution].height,
    palette: state.palette,
    shapeCount: state.shapeCount,
    seed: state.seed,
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
      p: state.palette,
      r: state.resolution,
      s: String(state.shapeCount),
      ...(state.seed && { seed: String(state.seed) }),
    });
    const url = `${window.location.origin}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  }, [state]);

  const handleDownload = useCallback(() => {
    const filename = `WP_${state.palette.toUpperCase()}_${state.resolution.toUpperCase()}_${state.seed || Date.now()}.png`;
    downloadPng(filename);
  }, [downloadPng, state.palette, state.resolution, state.seed]);

  const palettes = getAllPalettes();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium tracking-wider uppercase">WALLPAPER-GEN</h1>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <StatusIndicator status="nominal" label="SYSTEM" />
              <StatusIndicator status="nominal" label="CANVAS" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-muted-foreground">
              {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
          {/* Canvas Section */}
          <Panel title="OUTPUT PREVIEW">
            <div className="aspect-video bg-black/50 rounded-sm overflow-hidden border border-border/50">
              <WallpaperCanvas
                ref={canvasRef}
                width={options.width}
                height={options.height}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <ActionButton onClick={handleRandomize} label="RANDOMIZE" shortcut="R" />
              <ActionButton onClick={handleShare} label="COPY LINK" shortcut="C" />
              <ActionButton onClick={handleDownload} label="EXPORT PNG" shortcut="E" variant="primary" />
            </div>

            {/* Output Info */}
            {config && (
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                <InfoCell label="RESOLUTION" value={`${options.width}x${options.height}`} />
                <InfoCell label="SHAPES" value={String(state.shapeCount)} />
                <InfoCell label="COLORS" value={String(config.palette.length)} />
                <InfoCell label="SEED" value={String(config.seed || 'N/A').slice(-8)} mono />
              </div>
            )}
          </Panel>

          {/* Controls Section */}
          <div className="space-y-4">
            {/* Resolution Control */}
            <Panel title="RESOLUTION">
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(RESOLUTION_PRESETS) as ResolutionPreset[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setState((prev) => ({ ...prev, resolution: key }))}
                    className={cn(
                      'px-2 py-2 text-[10px] uppercase tracking-wider border transition-colors',
                      state.resolution === key
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {RESOLUTION_PRESETS[state.resolution].label}
              </div>
            </Panel>

            {/* Shape Count Control */}
            <Panel title="SHAPE COUNT">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={state.shapeCount}
                  onChange={(e) => setState((prev) => ({ 
                    ...prev, 
                    shapeCount: parseInt(e.target.value), 
                    seed: Date.now() 
                  }))}
                  className="flex-1 h-1 bg-border rounded-none appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-0"
                />
                <span className="text-2xl font-medium text-primary w-8 text-right">{state.shapeCount}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>MIN: 3</span>
                <span>MAX: 12</span>
              </div>
            </Panel>

            {/* Palette Selection */}
            <Panel title="COLOR PALETTE" className="max-h-[400px] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
                {palettes.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setState((prev) => ({ ...prev, palette: palette.name, seed: Date.now() }))}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 border transition-colors text-left',
                      state.palette === palette.name
                        ? 'bg-primary/10 border-primary'
                        : 'border-border/50 hover:border-border'
                    )}
                  >
                    {/* Color Preview */}
                    <div className="flex gap-px shrink-0">
                      {palette.colors.slice(0, 7).map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-6"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {/* Palette Info */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-[10px] uppercase tracking-wider truncate',
                        state.palette === palette.name ? 'text-primary' : 'text-foreground'
                      )}>
                        {palette.displayName}
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-2">
                        <span 
                          className="w-2 h-2 inline-block" 
                          style={{ backgroundColor: palette.background }}
                        />
                        <span>{palette.background}</span>
                      </div>
                    </div>
                    {/* Status */}
                    {state.palette === palette.name && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ 
  title, 
  children, 
  className 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('border border-border bg-card', className)}>
      <div className="px-3 py-2 border-b border-border bg-muted/50">
        <h2 className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="p-3">
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
    <div className="flex items-center gap-1.5">
      <div className={cn('w-1.5 h-1.5 rounded-full', colors[status])} />
      <span>{label}</span>
    </div>
  );
}

function ActionButton({ 
  onClick, 
  label, 
  shortcut,
  variant = 'default'
}: { 
  onClick: () => void; 
  label: string; 
  shortcut: string;
  variant?: 'default' | 'primary';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 text-[10px] uppercase tracking-wider border transition-colors flex items-center justify-center gap-2',
        variant === 'primary'
          ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      <span>{label}</span>
      <kbd className="text-[9px] px-1 py-0.5 bg-black/30 rounded-sm">{shortcut}</kbd>
    </button>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn('text-sm text-foreground', mono && 'font-mono')}>{value}</div>
    </div>
  );
}
