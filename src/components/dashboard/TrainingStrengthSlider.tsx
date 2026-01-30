import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TrainingStrengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function TrainingStrengthSlider({
  value,
  onChange,
  disabled = false,
  className,
}: TrainingStrengthSliderProps) {
  const getStrengthLabel = (strength: number) => {
    if (strength <= 25) return "Minimal";
    if (strength <= 50) return "Moderate";
    if (strength <= 75) return "Strong";
    return "Maximum";
  };

  const getStrengthDescription = (strength: number) => {
    if (strength <= 25) return "AI has creative freedom, light preference hints";
    if (strength <= 50) return "Balanced between creativity and your preferences";
    if (strength <= 75) return "AI closely follows your training data";
    return "Strict adherence to your preferences and examples";
  };

  const strengthLabel = getStrengthLabel(value);
  const strengthDescription = getStrengthDescription(value);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Training Strength</label>
        <span className="text-sm font-semibold text-primary">{value}%</span>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={5}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Creative</span>
        <span>Strict</span>
      </div>

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-sm font-medium text-foreground">{strengthLabel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{strengthDescription}</p>
      </div>
    </div>
  );
}
