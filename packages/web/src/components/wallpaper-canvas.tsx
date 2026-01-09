import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface WallpaperCanvasProps {
  className?: string;
  width?: number;
  height?: number;
}

export const WallpaperCanvas = forwardRef<HTMLCanvasElement, WallpaperCanvasProps>(
  ({ className, width = 1920, height = 1080 }, ref) => {
    return (
      <canvas ref={ref} width={width} height={height} className={cn("w-full h-auto", className)} />
    );
  },
);

WallpaperCanvas.displayName = "WallpaperCanvas";
