import { useState, useCallback, useRef } from "react";
import { extractColors } from "extract-colors";

interface FinalColor {
  hex: string;
  red: number;
  green: number;
  blue: number;
  area: number;
  hue: number;
  saturation: number;
  lightness: number;
  intensity: number;
}

const EXTRACTION_OPTIONS = {
  pixels: 50000,
  distance: 0.25,
  saturationDistance: 0.15,
  lightnessDistance: 0.2,
  hueDistance: 0.083333333,
  crossOrigin: "anonymous" as const,
  colorValidator: (r: number, g: number, b: number, a = 255) => {
    const luminance = (r + g + b) / 3;
    return a > 250 && luminance > 20 && luminance < 240;
  },
};

export interface ExtractedPalette {
  colors: string[];
  backgroundColor: string;
}

function processExtractedColors(colors: FinalColor[]): ExtractedPalette {
  const vibrant = colors
    .filter((c) => c.saturation > 0.25 && c.lightness > 0.15 && c.lightness < 0.85)
    .sort((a, b) => b.saturation * b.intensity - a.saturation * a.intensity);

  const neutralColors = colors
    .filter((c) => c.saturation < 0.3)
    .sort((a, b) => a.lightness - b.lightness);

  let backgroundHex: string;
  if (neutralColors.length > 0) {
    backgroundHex = neutralColors[0].hex;
  } else {
    const darkest = [...colors].sort((a, b) => a.lightness - b.lightness)[0];
    backgroundHex = darkest?.hex || "#212121";
  }

  const shapeColors = vibrant
    .filter((c) => c.hex.toLowerCase() !== backgroundHex.toLowerCase())
    .slice(0, 8);

  const finalColors =
    shapeColors.length >= 2
      ? shapeColors
      : colors
          .filter((c) => c.hex.toLowerCase() !== backgroundHex.toLowerCase())
          .slice(0, 5);

  return {
    colors: finalColors.map((c) => c.hex),
    backgroundColor: backgroundHex,
  };
}

interface UseImageColorExtractorReturn {
  extractFromFile: (file: File) => Promise<ExtractedPalette | null>;
  isExtracting: boolean;
  error: string | null;
  openFilePicker: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useImageColorExtractor(
  onExtracted: (palette: ExtractedPalette) => void
): UseImageColorExtractorReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extractFromFile = useCallback(
    async (file: File): Promise<ExtractedPalette | null> => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return null;
      }

      setIsExtracting(true);
      setError(null);

      const imageUrl = URL.createObjectURL(file);

      try {
        const extractedColors = (await extractColors(
          imageUrl,
          EXTRACTION_OPTIONS
        )) as FinalColor[];

        if (extractedColors.length === 0) {
          setError("Could not extract colors from this image");
          return null;
        }

        const palette = processExtractedColors(extractedColors);

        if (palette.colors.length < 2) {
          setError("Not enough distinct colors found in image");
          return null;
        }

        onExtracted(palette);
        return palette;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to extract colors";
        setError(message);
        return null;
      } finally {
        URL.revokeObjectURL(imageUrl);
        setIsExtracting(false);
      }
    },
    [onExtracted]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    extractFromFile,
    isExtracting,
    error,
    openFilePicker,
    fileInputRef,
  };
}
