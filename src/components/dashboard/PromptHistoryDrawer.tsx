import { useState, useEffect, useCallback } from "react";
import { History, Search, Trash2, Copy, ExternalLink, Loader2, Eye, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { downloadPromptAsText } from "@/lib/image-to-prompt";

interface PromptHistoryItem {
  id: string;
  image_url: string;
  prompt: string;
  negative_prompt: string | null;
  style: string;
  detail_level: string;
  art_style: string | null;
  dominant_colors: string[] | null;
  aspect_ratio: string | null;
  created_at: string;
}

interface PromptHistoryDrawerProps {
  onRegenerate?: (item: PromptHistoryItem) => void;
}

export function PromptHistoryDrawer({ onRegenerate }: PromptHistoryDrawerProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PromptHistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("prompt_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load prompt history");
    } else {
      setHistory(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("prompt_history")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }

    setHistory((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem(null);
    toast.success("Deleted from history");
  };

  const handleCopy = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = (item: PromptHistoryItem) => {
    let content = item.prompt;
    if (item.negative_prompt) {
      content += `\n\n--- Negative Prompt ---\n${item.negative_prompt}`;
    }
    downloadPromptAsText(content, `prompt-${item.style}-${item.detail_level}.txt`);
    toast.success("Downloaded!");
  };

  const handleRegenerate = (item: PromptHistoryItem) => {
    if (onRegenerate) {
      onRegenerate(item);
      setIsOpen(false);
      setSelectedItem(null);
    } else {
      toast.info("Regenerate feature not available");
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <History className="h-4 w-4" />
            History
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {history.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Prompt History
            </SheetTitle>
            <SheetDescription>
              View and reuse your previously generated prompts
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts..."
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-220px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No matching prompts found" : "No prompt history yet"}
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {filteredHistory.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onCopy={() => handleCopy(item.prompt)}
                      onDelete={() => handleDelete(item.id)}
                      onViewDetails={() => setSelectedItem(item)}
                      onRegenerate={() => handleRegenerate(item)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt Details</DialogTitle>
            <DialogDescription>
              Full prompt information and metadata
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 mt-4">
              {/* Image Preview */}
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedItem.image_url}
                  alt="Source"
                  className="w-full max-h-64 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Prompt Text */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Prompt</h4>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedItem.prompt}</p>
                </div>
              </div>

              {/* Negative Prompt */}
              {selectedItem.negative_prompt && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Negative Prompt</h4>
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <p className="text-sm text-destructive whitespace-pre-wrap">{selectedItem.negative_prompt}</p>
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Style</span>
                  <p className="font-medium text-sm capitalize">{selectedItem.style}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Detail Level</span>
                  <p className="font-medium text-sm capitalize">{selectedItem.detail_level}</p>
                </div>
                {selectedItem.art_style && (
                  <div>
                    <span className="text-xs text-muted-foreground">Art Style</span>
                    <p className="font-medium text-sm">{selectedItem.art_style}</p>
                  </div>
                )}
                {selectedItem.aspect_ratio && (
                  <div>
                    <span className="text-xs text-muted-foreground">Aspect Ratio</span>
                    <p className="font-medium text-sm">{selectedItem.aspect_ratio}</p>
                  </div>
                )}
              </div>

              {/* Colors */}
              {selectedItem.dominant_colors && selectedItem.dominant_colors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.dominant_colors.map((color, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-muted"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Created {formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true })}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(selectedItem.prompt)}
                  className="gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                  Copy Prompt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedItem)}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRegenerate(selectedItem)}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedItem.id)}
                  className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function HistoryCard({
  item,
  onCopy,
  onDelete,
  onViewDetails,
  onRegenerate,
}: {
  item: PromptHistoryItem;
  onCopy: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Image thumbnail */}
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
          <img
            src={item.image_url}
            alt="Source"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm line-clamp-3">{item.prompt}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          {item.style}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {item.detail_level}
        </Badge>
        {item.art_style && (
          <Badge variant="secondary" className="text-xs">
            {item.art_style}
          </Badge>
        )}
      </div>

      {/* Colors */}
      {item.dominant_colors && item.dominant_colors.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Colors:</span>
          <div className="flex gap-1">
            {item.dominant_colors.slice(0, 5).map((color, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded bg-muted"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onViewDetails}
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRegenerate}
            title="Regenerate"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCopy}
            title="Copy prompt"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => window.open(item.image_url, "_blank")}
            title="View image"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { PromptHistoryItem };
