import { RESOLUTION_PRESETS, type ResolutionPreset } from '@wallpaper-gen/core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResolutionSelectorProps {
  value: ResolutionPreset;
  onChange: (value: ResolutionPreset) => void;
}

export function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ResolutionPreset)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select resolution" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(RESOLUTION_PRESETS).map(([key, preset]) => (
          <SelectItem key={key} value={key}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
