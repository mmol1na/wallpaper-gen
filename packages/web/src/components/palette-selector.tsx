import { getAllPalettes, type PaletteDefinition } from '@wallpaper-gen/core';
import { cn } from '@/lib/utils';

interface PaletteSelectorProps {
  value: string;
  onChange: (paletteName: string) => void;
  className?: string;
}

export function PaletteSelector({ value, onChange, className }: PaletteSelectorProps) {
  const palettes = getAllPalettes();

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2', className)}>
      {palettes.map((palette) => (
        <PaletteCard
          key={palette.name}
          palette={palette}
          selected={value === palette.name}
          onClick={() => onChange(palette.name)}
        />
      ))}
    </div>
  );
}

interface PaletteCardProps {
  palette: PaletteDefinition;
  selected: boolean;
  onClick: () => void;
}

function PaletteCard({ palette, selected, onClick }: PaletteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-1.5 p-2 rounded-lg transition-all',
        'ring-1 ring-foreground/10 hover:ring-foreground/20',
        selected && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      <div className="flex gap-0.5 h-6 rounded overflow-hidden">
        {palette.colors.slice(0, 7).map((color, i) => (
          <div
            key={i}
            className="flex-1 h-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className="w-3 h-3 rounded-sm ring-1 ring-foreground/10"
          style={{ backgroundColor: palette.background }}
        />
        <span className="text-[10px] font-medium truncate">{palette.displayName}</span>
      </div>
    </button>
  );
}
