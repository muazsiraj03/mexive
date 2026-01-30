import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Eye, Trash2, ChevronDown, ChevronUp, FolderOpen, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationBatch, GenerationResult } from "@/hooks/use-dashboard";
import { toast } from "sonner";
import { generateSEOFilename } from "@/lib/seo-filename";
import { downloadBatchAsZip, getFileExtension } from "@/lib/file-downloader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BatchHistoryItemProps {
  batch: GenerationBatch;
  onDelete: (id: string) => void;
  onViewGeneration: (generation: GenerationResult) => void;
}

export function BatchHistoryItem({
  batch,
  onDelete,
  onViewGeneration,
}: BatchHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAllAsZip = async () => {
    if (batch.generations.length === 0) return;

    setIsDownloading(true);
    try {
      // Build file entries for all generations in the batch
      const files = batch.generations.map((gen) => ({
        imageUrl: gen.imageUrl,
        baseName: gen.displayName || gen.fileName.replace(/\.[^.]+$/, ""),
        marketplaces: gen.marketplaces.map((mp) => ({
          marketplace: mp.name,
          filename: generateSEOFilename({
            title: mp.title,
            keywords: mp.keywords,
            marketplace: mp.name,
            originalExtension: getFileExtension(gen.fileName),
          }),
          metadata: {
            title: mp.title,
            description: mp.description || "",
            keywords: mp.keywords,
          },
        })),
      }));

      // Calculate total files for progress feedback
      const totalFiles = files.reduce((sum, f) => sum + f.marketplaces.length, 0);
      
      await downloadBatchAsZip(files, `${batch.name.replace(/[^a-zA-Z0-9-_\s]/g, "")}.zip`);
      
      toast.success(`Downloaded ${batch.generations.length} images (${totalFiles} marketplace versions)`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download batch");
    } finally {
      setIsDownloading(false);
    }
  };

  // Get first 4 images for preview grid
  const previewImages = batch.generations.slice(0, 4);
  const remainingCount = batch.generations.length - 4;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card card-elevated">
      {/* Batch Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Preview Grid */}
          <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-muted">
            {previewImages.length > 0 ? (
              <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                {previewImages.map((gen, idx) => (
                  <div key={gen.id} className="relative overflow-hidden">
                    <img
                      src={gen.imageUrl}
                      alt={gen.fileName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
                {previewImages.length < 4 &&
                  Array.from({ length: 4 - previewImages.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bg-muted" />
                  ))}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-sm font-semibold text-white">+{remainingCount}</span>
              </div>
            )}
          </div>

          {/* Batch Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-secondary" />
              <h3 className="font-semibold text-foreground truncate">{batch.name}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {batch.generations.length} file{batch.generations.length !== 1 ? "s" : ""} •{" "}
              {formatDistanceToNow(batch.createdAt, { addSuffix: true })}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {batch.generations[0]?.marketplaces.map((m) => (
                <span
                  key={m.name}
                  className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllAsZip}
              disabled={isDownloading || batch.generations.length === 0}
              className="rounded-full"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {batch.generations.length} files in this batch.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(batch.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Batch
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-full"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {batch.generations.map((gen) => (
              <div
                key={gen.id}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-3 transition-all hover:border-secondary/20 hover:bg-background cursor-pointer"
                onClick={() => onViewGeneration(gen)}
              >
                <img
                  src={gen.imageUrl}
                  alt={gen.fileName}
                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {gen.displayName || gen.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gen.marketplaces.length} marketplace{gen.marketplaces.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}