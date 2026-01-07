import { useRef, useEffect, useCallback } from 'react';
import {
  generateWallpaper,
  renderWallpaper,
  type WallpaperConfig,
  type GeneratorOptions,
} from '@wallpaper-gen/core';

interface UseWallpaperCanvasProps {
  options: GeneratorOptions;
  onConfigGenerated?: (config: WallpaperConfig) => void;
}

export function useWallpaperCanvas({ options, onConfigGenerated }: UseWallpaperCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<WallpaperConfig | null>(null);

  const regenerate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const config = generateWallpaper(canvas, options);
    configRef.current = config;
    onConfigGenerated?.(config);
    return config;
  }, [options, onConfigGenerated]);

  const rerender = useCallback((config: WallpaperConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderWallpaper(canvas, config);
    configRef.current = config;
  }, []);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const downloadPng = useCallback((filename = 'wallpaper.png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  const getDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  return {
    canvasRef,
    config: configRef.current,
    regenerate,
    rerender,
    downloadPng,
    getDataUrl,
  };
}
