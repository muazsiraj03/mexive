import { useState } from "react";
import { X, Check, Loader2, AlertCircle, Copy, Download, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { copyToClipboard, downloadPromptAsText, PromptResult } from "@/lib/image-to-prompt";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: PromptResult;
  error?: string;
  uploadedImageUrl?: string;
}

interface ImagePromptQueueProps {
  queue: QueuedImage[];
  currentIndex: number;
  isProcessing: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onRetry: (id: string) => void;
  onRetryAllFailed: () => void;
}

export function ImagePromptQueue({
  queue,
  currentIndex,
  isProcessing,
  onRemove,
  onClear,
  onRetry,
  onRetryAllFailed,
}: ImagePromptQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const completedCount = queue.filter(q => q.status === "completed").length;
  const errorCount = queue.filter(q => q.status === "error").length;
  const overallProgress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

  const handleCopyPrompt = async (result: PromptResult) => {
    const success = await copyToClipboard(result.prompt);
    if (success) {
      toast.success("Prompt copied!");
    } else {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadPrompt = (result: PromptResult, fileName: string) => {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    let content = result.prompt;
    if (result.negativePrompt) {
      content += `\n\n--- Negative Prompt ---\n${result.negativePrompt}`;
    }
    downloadPromptAsText(content, `${baseName}-prompt.txt`);
    toast.success("Prompt downloaded!");
  };

  const handleDownloadAll = () => {
    const completedItems = queue.filter(q => q.status === "completed" && q.result);
    if (completedItems.length === 0) {
      toast.error("No completed prompts to download");
      return;
    }

    // Combine all prompts into a single text file
    const allPromptsContent = completedItems
      .map((item) => {
        let content = `=== ${item.file.name} ===\n\n${item.result?.prompt}`;
        if (item.result?.negativePrompt) {
          content += `\n\n--- Negative Prompt ---\n${item.result.negativePrompt}`;
        }
        return content;
      })
      .join("\n\n" + "=".repeat(50) + "\n\n");

    downloadPromptAsText(allPromptsContent, `batch-prompts-${Date.now()}.txt`);
    toast.success(`Downloaded ${completedItems.length} prompts in one file!`);
  };

  const handleCopyAll = async () => {
    const completedItems = queue.filter(q => q.status === "completed" && q.result);
    if (completedItems.length === 0) {
      toast.error("No completed prompts to copy");
      return;
    }

    const allPrompts = completedItems
      .map((item, index) => `--- ${item.file.name} ---\n${item.result?.prompt}`)
      .join("\n\n");

    const success = await copyToClipboard(allPrompts);
    if (success) {
      toast.success(`Copied ${completedItems.length} prompts!`);
    } else {
      toast.error("Failed to copy");
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
      {/* Header Row 1: Title, Badge, Retry All, Clear All */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">Image Queue</h3>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{queue.length} completed
          </Badge>
          {errorCount > 0 && (
            <>
              <Badge variant="destructive" className="text-xs">
                {errorCount} failed
              </Badge>
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetryAllFailed}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCw className="h-3 w-3" />
                  Retry All
                </Button>
              )}
            </>
          )}
        </div>
        {!isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Header Row 2: Copy All, Download All */}
      {completedCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            className="h-8"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadAll}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download All
          </Button>
        </div>
      )}

      {/* Overall Progress */}
      {isProcessing && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Processing image {currentIndex + 1} of {queue.length}...
            </span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Queue Items */}
      <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="space-y-2">
          {queue.map((item, index) => (
            <Collapsible
              key={item.id}
              open={expandedId === item.id}
              onOpenChange={(open) => setExpandedId(open ? item.id : null)}
            >
              <div
                className={cn(
                  "rounded-xl border bg-background/50 transition-colors",
                  item.status === "processing" && "border-primary/50 bg-primary/5",
                  item.status === "completed" && "border-green-500/30",
                  item.status === "error" && "border-destructive/30"
                )}
              >
                {/* Queue Item Header */}
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === "pending" && (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    )}
                    {item.status === "processing" && (
                      <Badge className="text-xs bg-primary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {item.status === "completed" && (
                      <Badge className="text-xs bg-green-600 hover:bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    )}
                    {item.status === "error" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}

                    {/* Retry button for failed items */}
                    {item.status === "error" && !isProcessing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(item.id);
                        }}
                      >
                        <RotateCw className="h-3 w-3" />
                        Retry
                      </Button>
                    )}

                    {/* Actions */}
                    {item.status === "completed" && item.result && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(item.result!);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {expandedId === item.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </>
                    )}

                    {item.status === "pending" && !isProcessing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Prompt Content */}
                <CollapsibleContent>
                  {item.result && (
                    <div className="px-3 pb-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.result.prompt}
                        </p>
                        {item.result.negativePrompt && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Negative Prompt
                            </p>
                            <p className="text-sm text-destructive/80">
                              {item.result.negativePrompt}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleDownloadPrompt(item.result!, item.file.name)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                  {item.error && (
                    <div className="px-3 pb-3">
                      <div className="rounded-lg bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">{item.error}</p>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
