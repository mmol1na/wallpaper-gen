import { useState, useCallback, useMemo } from 'react';
import { RESOLUTION_PRESETS, type ResolutionPreset, type GeneratorOptions, type WallpaperConfig } from '@wallpaper-gen/core';
import { useWallpaperCanvas } from '@/hooks/use-wallpaper-canvas';
import { WallpaperCanvas } from './wallpaper-canvas';
import { PaletteSelector } from './palette-selector';
import { ResolutionSelector } from './resolution-selector';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download04Icon, Share08Icon, RefreshIcon } from '@hugeicons/core-free-icons';

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
  });

  const [config, setConfig] = useState<WallpaperConfig | null>(null);

  const options: GeneratorOptions = useMemo(() => ({
    width: RESOLUTION_PRESETS[state.resolution].width,
    height: RESOLUTION_PRESETS[state.resolution].height,
    palette: state.palette,
    shapeCount: state.shapeCount,
    seed: state.seed,
  }), [state]);

  const { canvasRef, regenerate, downloadPng } = useWallpaperCanvas({
    options,
    onConfigGenerated: setConfig,
  });

  const handleRandomize = useCallback(() => {
    setState((prev) => ({
      ...prev,
      seed: Date.now(),
    }));
  }, []);

  const handleShare = useCallback(() => {
    const params = new URLSearchParams({
      palette: state.palette,
      resolution: state.resolution,
      shapes: String(state.shapeCount),
      ...(state.seed && { seed: String(state.seed) }),
    });
    const url = `${window.location.origin}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }, [state]);

  const handleDownload = useCallback(() => {
    const filename = `wallpaper-${state.palette}-${state.resolution}-${Date.now()}.png`;
    downloadPng(filename);
  }, [downloadPng, state.palette, state.resolution]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Wallpaper Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create beautiful geometric wallpapers
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div className="space-y-4">
            <div className="aspect-video relative rounded-xl overflow-hidden bg-muted/50 ring-1 ring-foreground/10">
              <WallpaperCanvas
                ref={canvasRef}
                width={options.width}
                height={options.height}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRandomize} variant="outline" className="flex-1">
                <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
                Randomize
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <HugeiconsIcon icon={Share08Icon} data-icon="inline-start" />
                Share
              </Button>
              <Button onClick={handleDownload} className="flex-1">
                <HugeiconsIcon icon={Download04Icon} data-icon="inline-start" />
                Download
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Resolution</label>
                  <ResolutionSelector
                    value={state.resolution}
                    onChange={(resolution) => setState((prev) => ({ ...prev, resolution }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-medium">Shapes</label>
                    <span className="text-xs text-muted-foreground">{state.shapeCount}</span>
                  </div>
                  <Slider
                    value={state.shapeCount}
                    onChange={(shapeCount) => setState((prev) => ({ ...prev, shapeCount, seed: Date.now() }))}
                    min={3}
                    max={12}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <PaletteSelector
                  value={state.palette}
                  onChange={(palette) => setState((prev) => ({ ...prev, palette, seed: Date.now() }))}
                />
              </CardContent>
            </Card>

            {config && (
              <Card size="sm">
                <CardContent className="pt-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Seed: {config.seed ?? 'random'}</p>
                    <p>Colors: {config.palette.length}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
