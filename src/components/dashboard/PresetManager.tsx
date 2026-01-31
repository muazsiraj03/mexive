import { useState, useEffect, useCallback } from "react";
import { Palette, Plus, Trash2, Check, Star, Loader2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PromptTrainingPreferences } from "@/hooks/use-prompt-training";

interface TrainingPreset {
  id: string;
  name: string;
  category: string;
  preferences: PromptTrainingPreferences;
  is_default: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "portrait", label: "Portraits" },
  { value: "landscape", label: "Landscapes" },
  { value: "product", label: "Products" },
  { value: "architecture", label: "Architecture" },
  { value: "abstract", label: "Abstract" },
];

interface PresetManagerProps {
  currentPreferences: PromptTrainingPreferences;
  onLoadPreset: (preferences: PromptTrainingPreferences) => void;
}

export function PresetManager({ currentPreferences, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPresets = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("training_presets")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching presets:", error);
    } else {
      // Parse the preferences from the stored JSON
      const parsedPresets = (data || []).map((preset) => ({
        ...preset,
        preferences: preset.preferences as unknown as PromptTrainingPreferences,
      }));
      setPresets(parsedPresets);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [isOpen, fetchPresets]);

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      setIsSaving(false);
      return;
    }

    const preferencesJson = JSON.parse(JSON.stringify(currentPreferences));
    
    const { data, error } = await supabase
      .from("training_presets")
      .insert([{
        user_id: user.id,
        name: newPresetName.trim(),
        category: newPresetCategory,
        preferences: preferencesJson,
        is_default: presets.length === 0,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving preset:", error);
      toast.error("Failed to save preset");
    } else {
      setPresets((prev) => [
        ...prev,
        { ...data, preferences: data.preferences as unknown as PromptTrainingPreferences },
      ]);
      toast.success("Preset saved!");
      setNewPresetName("");
      setIsSaveDialogOpen(false);
    }
    setIsSaving(false);
  };

  const handleLoadPreset = (preset: TrainingPreset) => {
    onLoadPreset(preset.preferences);
    toast.success(`Loaded "${preset.name}" preset`);
    setIsOpen(false);
  };

  const handleSetDefault = async (presetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear all defaults first
    await supabase
      .from("training_presets")
      .update({ is_default: false })
      .eq("user_id", user.id);

    // Set new default
    await supabase
      .from("training_presets")
      .update({ is_default: true })
      .eq("id", presetId);

    setPresets((prev) =>
      prev.map((p) => ({ ...p, is_default: p.id === presetId }))
    );
    toast.success("Default preset updated");
  };

  const handleDeletePreset = async (presetId: string) => {
    const { error } = await supabase
      .from("training_presets")
      .delete()
      .eq("id", presetId);

    if (error) {
      toast.error("Failed to delete preset");
      return;
    }

    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    toast.success("Preset deleted");
  };

  const handleExportPresets = () => {
    const exportData = presets.map(({ name, category, preferences, is_default }) => ({
      name,
      category,
      preferences,
      is_default,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training-presets.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Presets exported!");
  };

  const handleImportPresets = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Array<{
        name: string;
        category: string;
        preferences: PromptTrainingPreferences;
        is_default: boolean;
      }>;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }

      for (const preset of imported) {
        const preferencesJson = JSON.parse(JSON.stringify(preset.preferences));
        await supabase.from("training_presets").insert([{
          user_id: user.id,
          name: preset.name,
          category: preset.category,
          preferences: preferencesJson,
          is_default: false,
        }]);
      }

      await fetchPresets();
      toast.success(`Imported ${imported.length} presets`);
    } catch {
      toast.error("Invalid preset file");
    }

    e.target.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          Presets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Style Presets
          </DialogTitle>
          <DialogDescription>
            Save and load training configurations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Save Current
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Save Preset</DialogTitle>
                  <DialogDescription>
                    Save your current training settings as a preset
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preset Name</label>
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="e.g., Cinematic Style"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newPresetCategory} onValueChange={setNewPresetCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSavePreset}
                    disabled={isSaving || !newPresetName.trim()}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Preset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportPresets}
              disabled={presets.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportPresets}
              />
            </label>
          </div>

          {/* Presets List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No presets saved yet. Save your current settings to create one!
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{preset.name}</span>
                          {preset.is_default && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES.find((c) => c.value === preset.category)?.label || preset.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleLoadPreset(preset)}
                          title="Load preset"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleSetDefault(preset.id)}
                          title="Set as default"
                          disabled={preset.is_default}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePreset(preset.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Preview of preferences */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.preferences.preferred_tone && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {preset.preferences.preferred_tone}
                        </span>
                      )}
                      {preset.preferences.include_keywords?.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                        >
                          +{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
