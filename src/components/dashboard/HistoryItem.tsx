import { formatDistanceToNow } from "date-fns";
import { Eye, Download, Trash2, MoreVertical, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GenerationResult } from "@/hooks/use-dashboard";
import { toast } from "sonner";
import { generateSEOFilename } from "@/lib/seo-filename";
import { downloadImageWithSEOName, getFileExtension } from "@/lib/file-downloader";

interface HistoryItemProps {
  generation: GenerationResult;
  onDelete: (id: string) => void;
  onView?: (generation: GenerationResult) => void;
  variant?: "grid" | "list";
}

// Format filename for display: remove extension, replace dashes/underscores with spaces
function formatDisplayName(fileName: string): string {
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
  // Replace dashes, underscores, and hyphens with spaces
  const withSpaces = nameWithoutExt.replace(/[-_]/g, " ");
  // Capitalize first letter of each word and clean up multiple spaces
  return withSpaces
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Get the display name: use custom displayName if set, otherwise format the fileName
function getDisplayName(generation: GenerationResult): string {
  const custom = generation.displayName?.trim();
  if (custom) return custom;

  const mp =
    generation.marketplaces?.find((m) => m.name === "Adobe Stock") ??
    generation.marketplaces?.[0];
  if (mp) {
    try {
      // Prefer the same SEO filename users get when downloading
      return generateSEOFilename({
        title: mp.title,
        keywords: mp.keywords,
        marketplace: mp.name,
        originalExtension: getFileExtension(generation.fileName),
      });
    } catch {
      // ignore and fall back
    }
  }

  return formatDisplayName(generation.fileName);
}

export function HistoryItem({
  generation,
  onDelete,
  onView,
  variant = "list",
}: HistoryItemProps) {
  const displayName = getDisplayName(generation);
  const handleExport = () => {
    const headers = ["Marketplace", "Title", "Keywords"];
    const rows = generation.marketplaces.map((m) => [
      m.name,
      `"${m.title}"`,
      `"${m.keywords.join(", ")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generation.fileName}-metadata.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported!");
  };

  const handleDownloadForMarketplace = async (marketplaceName: string) => {
    const mp = generation.marketplaces.find((m) => m.name === marketplaceName);
    if (!mp) return;

    try {
      const filename = generateSEOFilename({
        title: mp.title,
        keywords: mp.keywords,
        marketplace: mp.name,
        originalExtension: getFileExtension(generation.fileName),
      });

      // Prepare metadata for embedding into file properties
      const metadata = {
        title: mp.title,
        description: mp.description || "",
        keywords: mp.keywords,
      };

      await downloadImageWithSEOName(generation.imageUrl, filename, metadata);
      toast.success(`Downloaded with embedded metadata`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  if (variant === "grid") {
    return (
      <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card card-elevated transition-all hover:-translate-y-1 hover:border-secondary/20 hover:card-elevated-lg">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={generation.imageUrl}
            alt={generation.fileName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {generation.marketplaces.map((m) => (
              <span
                key={m.name}
                className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-medium text-foreground"
              >
                {m.name.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4">
          <p className="truncate font-medium text-foreground">
            {displayName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDistanceToNow(generation.createdAt, { addSuffix: true })}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView?.(generation)}
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {generation.marketplaces.map((mp) => (
                  <DropdownMenuItem
                    key={mp.name}
                    onClick={() => handleDownloadForMarketplace(mp.name)}
                  >
                    {mp.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(generation.id)}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-secondary/20 hover:card-elevated">
      <img
        src={generation.imageUrl}
        alt={generation.fileName}
        className="h-16 w-16 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-foreground">
          {displayName}
        </p>
        <p className="text-sm text-muted-foreground">
          {generation.marketplaces.length} marketplace
          {generation.marketplaces.length !== 1 ? "s" : ""} •{" "}
          {formatDistanceToNow(generation.createdAt, { addSuffix: true })}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {generation.marketplaces.map((m) => (
            <span
              key={m.name}
              className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary"
            >
              {m.name}
            </span>
          ))}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView?.(generation)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Image className="mr-2 h-4 w-4" />
              Download Image
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {generation.marketplaces.map((mp) => (
                <DropdownMenuItem
                  key={mp.name}
                  onClick={() => handleDownloadForMarketplace(mp.name)}
                >
                  Download for {mp.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(generation.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
