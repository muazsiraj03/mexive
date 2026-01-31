import { useState } from "react";
import { Brain, Settings2, BookOpen, ThumbsUp, ThumbsDown, Trash2, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePromptTraining, PromptExample, PromptTrainingPreferences } from "@/hooks/use-prompt-training";
import { cn } from "@/lib/utils";
import { TrainingStrengthSlider } from "./TrainingStrengthSlider";
import { PresetManager } from "./PresetManager";

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral", description: "Balanced and objective" },
  { value: "creative", label: "Creative", description: "Artistic and imaginative" },
  { value: "technical", label: "Technical", description: "Precise and detailed" },
  { value: "poetic", label: "Poetic", description: "Lyrical and evocative" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short", description: "50-100 words" },
  { value: "medium", label: "Medium", description: "150-250 words" },
  { value: "long", label: "Long", description: "300+ words" },
];

export function PromptTrainingPanel() {
  const {
    preferences,
    examples,
    feedback,
    savePreferences,
    deleteExample,
    hasTrainingData,
  } = usePromptTraining();

  const [newIncludeKeyword, setNewIncludeKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");
  const [customInstructions, setCustomInstructions] = useState(preferences.custom_instructions || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddIncludeKeyword = () => {
    if (!newIncludeKeyword.trim()) return;
    const updated = [...preferences.include_keywords, newIncludeKeyword.trim()];
    savePreferences({ include_keywords: updated });
    setNewIncludeKeyword("");
  };

  const handleRemoveIncludeKeyword = (keyword: string) => {
    const updated = preferences.include_keywords.filter(k => k !== keyword);
    savePreferences({ include_keywords: updated });
  };

  const handleAddExcludeKeyword = () => {
    if (!newExcludeKeyword.trim()) return;
    const updated = [...preferences.exclude_keywords, newExcludeKeyword.trim()];
    savePreferences({ exclude_keywords: updated });
    setNewExcludeKeyword("");
  };

  const handleRemoveExcludeKeyword = (keyword: string) => {
    const updated = preferences.exclude_keywords.filter(k => k !== keyword);
    savePreferences({ exclude_keywords: updated });
  };

  const handleSaveInstructions = async () => {
    setIsSaving(true);
    await savePreferences({ custom_instructions: customInstructions || null });
    setIsSaving(false);
  };

  const positiveExamples = examples.filter(e => e.is_positive);
  const negativeExamples = examples.filter(e => !e.is_positive);
  const positiveCount = feedback.filter(f => f.rating === 1).length;
  const negativeCount = feedback.filter(f => f.rating === -1).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Brain className="h-4 w-4" />
          Always
          {hasTrainingData && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              <Sparkles className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Persistent Training
          </SheetTitle>
          <SheetDescription>
            Settings that apply to <strong>all</strong> future prompt generations
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="preferences" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 text-xs">
              <ThumbsUp className="h-3.5 w-3.5" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-4 space-y-6">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Training Strength */}
                <TrainingStrengthSlider
                  value={preferences.training_strength}
                  onChange={(v) => savePreferences({ training_strength: v })}
                />

                {/* Preset Manager */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Style Presets</label>
                  <p className="text-xs text-muted-foreground">
                    Save and load complete training configurations
                  </p>
                  <PresetManager
                    currentPreferences={preferences}
                    onLoadPreset={(prefs: PromptTrainingPreferences) => savePreferences(prefs)}
                  />
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Tone</label>
                  <Select
                    value={preferences.preferred_tone}
                    onValueChange={(v) => savePreferences({ preferred_tone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Length</label>
                  <Select
                    value={preferences.preferred_length}
                    onValueChange={(v) => savePreferences({ preferred_length: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Include Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Always Include (keywords)</label>
                  <p className="text-xs text-muted-foreground">
                    These words/phrases will be incorporated into generated prompts
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newIncludeKeyword}
                      onChange={(e) => setNewIncludeKeyword(e.target.value)}
                      placeholder="e.g., cinematic lighting"
                      onKeyDown={(e) => e.key === "Enter" && handleAddIncludeKeyword()}
                    />
                    <Button size="icon" onClick={handleAddIncludeKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferences.include_keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="gap-1">
                        {kw}
                        <button onClick={() => handleRemoveIncludeKeyword(kw)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Exclude Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Never Include (keywords)</label>
                  <p className="text-xs text-muted-foreground">
                    These words/phrases will be avoided in generated prompts
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newExcludeKeyword}
                      onChange={(e) => setNewExcludeKeyword(e.target.value)}
                      placeholder="e.g., blurry"
                      onKeyDown={(e) => e.key === "Enter" && handleAddExcludeKeyword()}
                    />
                    <Button size="icon" variant="destructive" onClick={handleAddExcludeKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferences.exclude_keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="gap-1 border-destructive/50 text-destructive">
                        {kw}
                        <button onClick={() => handleRemoveExcludeKeyword(kw)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Instructions</label>
                  <p className="text-xs text-muted-foreground">
                    Add any specific instructions for the AI prompt generator
                  </p>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Always mention the time of day. Prefer warm color palettes..."
                    rows={4}
                  />
                  <Button
                    onClick={handleSaveInstructions}
                    disabled={isSaving || customInstructions === (preferences.custom_instructions || "")}
                    size="sm"
                  >
                    {isSaving ? "Saving..." : "Save Instructions"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                <p className="text-sm text-muted-foreground">
                  Save prompts as examples to teach the AI your preferred style. Good examples help the AI learn what you like, bad examples teach it what to avoid.
                </p>

                {/* Good Examples */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    Good Examples ({positiveExamples.length})
                  </h4>
                  {positiveExamples.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No good examples saved yet. Click "Save as Example" on prompts you like!
                    </p>
                  ) : (
                    positiveExamples.map((ex) => (
                      <ExampleCard key={ex.id} example={ex} onDelete={() => deleteExample(ex.id)} />
                    ))
                  )}
                </div>

                {/* Bad Examples */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    Bad Examples ({negativeExamples.length})
                  </h4>
                  {negativeExamples.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No bad examples saved yet.
                    </p>
                  ) : (
                    negativeExamples.map((ex) => (
                      <ExampleCard key={ex.id} example={ex} onDelete={() => deleteExample(ex.id)} />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                <div className="flex gap-4">
                  <div className="flex-1 rounded-lg bg-green-500/10 p-4 text-center">
                    <ThumbsUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
                    <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
                    <p className="text-xs text-muted-foreground">Liked</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-red-500/10 p-4 text-center">
                    <ThumbsDown className="h-6 w-6 mx-auto text-red-600 mb-1" />
                    <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
                    <p className="text-xs text-muted-foreground">Disliked</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Your feedback helps improve future generations. The more you rate, the better the AI learns your preferences.
                </p>

                {feedback.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">
                    No feedback given yet. Rate generated prompts to train the AI!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {feedback.slice(0, 10).map((fb) => (
                      <div
                        key={fb.id}
                        className={cn(
                          "rounded-lg border p-3",
                          fb.rating === 1 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {fb.rating === 1 ? (
                            <ThumbsUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {fb.prompt_text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {fb.style}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function ExampleCard({ example, onDelete }: { example: PromptExample; onDelete: () => void }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        example.is_positive ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
      )}
    >
      <p className="text-sm line-clamp-3">{example.prompt_text}</p>
      {example.notes && (
        <p className="text-xs text-muted-foreground mt-1 italic">Note: {example.notes}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className="text-xs">{example.style}</Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
