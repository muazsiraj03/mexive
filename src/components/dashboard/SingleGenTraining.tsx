import { useState } from "react";
import { Zap, X, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SingleGenTrainingSettings {
  enabled: boolean;
  training_strength: number;
  preferred_tone: string;
  preferred_length: string;
  include_keywords: string[];
  exclude_keywords: string[];
  custom_instructions: string;
}

const DEFAULT_SETTINGS: SingleGenTrainingSettings = {
  enabled: false,
  training_strength: 75,
  preferred_tone: "neutral",
  preferred_length: "medium",
  include_keywords: [],
  exclude_keywords: [],
  custom_instructions: "",
};

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "creative", label: "Creative" },
  { value: "technical", label: "Technical" },
  { value: "poetic", label: "Poetic" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

interface SingleGenTrainingProps {
  settings: SingleGenTrainingSettings;
  onChange: (settings: SingleGenTrainingSettings) => void;
  onPromoteToPersistent?: (settings: SingleGenTrainingSettings) => Promise<boolean>;
}

export function SingleGenTraining({ settings, onChange, onPromoteToPersistent }: SingleGenTrainingProps) {
  const [newIncludeKeyword, setNewIncludeKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  const updateSettings = (updates: Partial<SingleGenTrainingSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const handleAddIncludeKeyword = () => {
    if (!newIncludeKeyword.trim()) return;
    updateSettings({
      include_keywords: [...settings.include_keywords, newIncludeKeyword.trim()],
    });
    setNewIncludeKeyword("");
  };

  const handleRemoveIncludeKeyword = (keyword: string) => {
    updateSettings({
      include_keywords: settings.include_keywords.filter((k) => k !== keyword),
    });
  };

  const handleAddExcludeKeyword = () => {
    if (!newExcludeKeyword.trim()) return;
    updateSettings({
      exclude_keywords: [...settings.exclude_keywords, newExcludeKeyword.trim()],
    });
    setNewExcludeKeyword("");
  };

  const handleRemoveExcludeKeyword = (keyword: string) => {
    updateSettings({
      exclude_keywords: settings.exclude_keywords.filter((k) => k !== keyword),
    });
  };

  const handleClear = () => {
    onChange(DEFAULT_SETTINGS);
  };

  const handlePromoteToPersistent = async () => {
    if (!onPromoteToPersistent) return;
    setIsPromoting(true);
    try {
      const success = await onPromoteToPersistent(settings);
      if (success) {
        toast.success("Settings saved to persistent training!");
        // Clear single-gen after promoting
        onChange(DEFAULT_SETTINGS);
      }
    } finally {
      setIsPromoting(false);
    }
  };

  const hasOverrides =
    settings.include_keywords.length > 0 ||
    settings.exclude_keywords.length > 0 ||
    settings.custom_instructions.length > 0 ||
    settings.preferred_tone !== "neutral" ||
    settings.preferred_length !== "medium" ||
    settings.training_strength !== 75;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={settings.enabled ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2 rounded-full",
            settings.enabled && "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          )}
        >
          <Zap className="h-4 w-4" />
          This Gen
          {settings.enabled && hasOverrides && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-white/20 text-secondary-foreground">
              {settings.include_keywords.length + settings.exclude_keywords.length || "✓"}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">This Generation Only</h4>
              <p className="text-xs text-muted-foreground">
                Temporary settings for the next prompt
              </p>
            </div>
            <Button
              variant={settings.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className={cn(
                settings.enabled && "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              )}
            >
              {settings.enabled ? "On" : "Off"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          <div className={cn("p-4 space-y-4", !settings.enabled && "opacity-50 pointer-events-none")}>
            {/* Training Strength */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Strength</label>
                <span className="text-xs font-semibold text-primary">{settings.training_strength}%</span>
              </div>
              <Slider
                value={[settings.training_strength]}
                onValueChange={([v]) => updateSettings({ training_strength: v })}
                min={0}
                max={100}
                step={5}
                disabled={!settings.enabled}
              />
            </div>

            {/* Tone & Length */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Tone</label>
                <Select
                  value={settings.preferred_tone}
                  onValueChange={(v) => updateSettings({ preferred_tone: v })}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Length</label>
                <Select
                  value={settings.preferred_length}
                  onValueChange={(v) => updateSettings({ preferred_length: v })}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Include Keywords */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Include Keywords</label>
              <div className="flex gap-1">
                <Input
                  value={newIncludeKeyword}
                  onChange={(e) => setNewIncludeKeyword(e.target.value)}
                  placeholder="Add keyword..."
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAddIncludeKeyword()}
                  disabled={!settings.enabled}
                />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddIncludeKeyword} disabled={!settings.enabled}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {settings.include_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {settings.include_keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                      {kw}
                      <button onClick={() => handleRemoveIncludeKeyword(kw)}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Exclude Keywords */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Exclude Keywords</label>
              <div className="flex gap-1">
                <Input
                  value={newExcludeKeyword}
                  onChange={(e) => setNewExcludeKeyword(e.target.value)}
                  placeholder="Add keyword..."
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAddExcludeKeyword()}
                  disabled={!settings.enabled}
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 shrink-0"
                  onClick={handleAddExcludeKeyword}
                  disabled={!settings.enabled}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {settings.exclude_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {settings.exclude_keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="gap-1 text-xs px-2 py-0.5 border-destructive/50 text-destructive">
                      {kw}
                      <button onClick={() => handleRemoveExcludeKeyword(kw)}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Custom Instructions</label>
              <Textarea
                value={settings.custom_instructions}
                onChange={(e) => updateSettings({ custom_instructions: e.target.value })}
                placeholder="Special instructions for this generation..."
                className="text-xs min-h-[60px] resize-none"
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </ScrollArea>

        {settings.enabled && hasOverrides && (
          <div className="p-3 border-t border-border space-y-2">
            {onPromoteToPersistent && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={handlePromoteToPersistent}
                disabled={isPromoting}
              >
                <Save className="h-3 w-3" />
                {isPromoting ? "Saving..." : "Save to Always Training"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={handleClear}
            >
              Clear All Overrides
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DEFAULT_SETTINGS as DEFAULT_SINGLE_GEN_SETTINGS };
