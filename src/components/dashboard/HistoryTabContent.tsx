import { useState } from "react";
import { Search, RefreshCw, Loader2, Pencil, Check, X, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryItem } from "./HistoryItem";
import { BatchHistoryItem } from "./BatchHistoryItem";
import { MetadataCard } from "./MetadataCard";
import { MarketplaceSelector, MARKETPLACES } from "./MarketplaceSelector";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useDashboard, GenerationResult } from "@/hooks/use-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateSEOFilename } from "@/lib/seo-filename";
import { downloadImageWithSEOName, getFileExtension } from "@/lib/file-downloader";

const MARKETPLACE_COLORS: Record<string, string> = {
  "Adobe Stock": "bg-red-500",
  Shutterstock: "bg-orange-500",
  Freepik: "bg-blue-500",
};

// Format filename for display: remove extension, replace dashes/underscores with spaces
function formatDisplayName(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
  const withSpaces = nameWithoutExt.replace(/[-_]/g, " ");
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

// Empty state component
function EmptyState({ search, message }: { search: string; message?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-12 text-center card-elevated">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Search className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {message || "No generations found"}
      </h3>
      <p className="mt-1 text-muted-foreground">
        {search
          ? "Try adjusting your search terms"
          : "Start by uploading an image to generate metadata"}
      </p>
    </div>
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            if (page === 1 || page === totalPages) return true;
            if (Math.abs(page - currentPage) <= 1) return true;
            return false;
          })
          .map((page, idx, arr) => {
            const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
            return (
              <span key={page} className="flex items-center">
                {showEllipsisBefore && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === page ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              </span>
            );
          })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function HistoryTabContent() {
  const { generations, batches, deleteGeneration, deleteBatch, updateMarketplaceKeywords, updateDisplayName, regenerateMetadata, user, isAdmin } = useDashboard();
  const [search, setSearch] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationResult | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateMarketplaces, setRegenerateMarketplaces] = useState<string[]>(["adobe", "shutterstock"]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [activeTab, setActiveTab] = useState<"all" | "batches" | "singles">("all");

  // Filter generations that are NOT in any batch (singles)
  const singleGenerations = generations.filter((g) => !g.batchId);
  
  // Filter based on search
  const filteredSingles = singleGenerations.filter((g) =>
    g.fileName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.generations.some((g) => g.fileName.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination for singles
  const totalPages = Math.ceil(filteredSingles.length / itemsPerPage);
  const paginatedSingles = filteredSingles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    deleteGeneration(id);
    toast.success("Generation deleted");
  };

  // Download image for a specific marketplace from dialog
  const handleDownloadForMarketplace = async (generation: GenerationResult, marketplaceName: string) => {
    const mp = generation.marketplaces.find((m) => m.name === marketplaceName);
    if (!mp) return;

    try {
      const filename = generateSEOFilename({
        title: mp.title,
        keywords: mp.keywords,
        marketplace: mp.name,
        originalExtension: getFileExtension(generation.fileName),
      });

      const metadata = {
        title: mp.title,
        description: mp.description || "",
        keywords: mp.keywords,
      };

      await downloadImageWithSEOName(generation.imageUrl, filename, metadata);
      toast.success(`Downloaded as ${filename} with embedded metadata`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!selectedGeneration || regenerateMarketplaces.length === 0) return;

    // Check credits
    const creditsNeeded = regenerateMarketplaces.length;
    if (!isAdmin && !user.hasUnlimitedCredits && user.credits < creditsNeeded) {
      toast.error(`Not enough credits. You need ${creditsNeeded} credits.`);
      return;
    }

    setIsRegenerating(true);
    try {
      // Convert marketplace IDs to names
      const marketplaceNames = regenerateMarketplaces.map(
        (mpId) => MARKETPLACES.find((m) => m.id === mpId)!.name
      );

      await regenerateMetadata(selectedGeneration.id, marketplaceNames);
      
      toast.success("Metadata regenerated successfully!");
      setShowRegenerateDialog(false);
      setSelectedGeneration(null);
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate metadata");
    } finally {
      setIsRegenerating(false);
    }
  };

  const openRegenerateDialog = () => {
    // Pre-select marketplaces that were previously generated
    if (selectedGeneration) {
      const existingMpIds = selectedGeneration.marketplaces
        .map((mp) => MARKETPLACES.find((m) => m.name === mp.name)?.id)
        .filter(Boolean) as string[];
      setRegenerateMarketplaces(existingMpIds.length > 0 ? existingMpIds : ["adobe", "shutterstock"]);
    }
    setShowRegenerateDialog(true);
  };

  const startEditingName = () => {
    if (selectedGeneration) {
      setEditedName(getDisplayName(selectedGeneration));
      setIsEditingName(true);
    }
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const saveDisplayName = async () => {
    if (!selectedGeneration || !editedName.trim()) return;

    try {
      await updateDisplayName(selectedGeneration.id, editedName.trim());
      setSelectedGeneration(prev => prev ? { ...prev, displayName: editedName.trim() } : null);
      toast.success("Name updated");
      setIsEditingName(false);
    } catch {
      toast.error("Failed to update name");
    }
  };

  return (
    <>
      {/* Filters */}
      <AnimatedSection variant="fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by filename or batch name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredBatches.length} batch{filteredBatches.length !== 1 ? "es" : ""} •{" "}
              {filteredSingles.length} single{filteredSingles.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </AnimatedSection>

      {/* Tabs for Batches and Singles */}
      <AnimatedSection variant="fade-up" delay={100}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "batches" | "singles")} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Batches
            </TabsTrigger>
            <TabsTrigger value="singles">Singles</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4">
            {filteredBatches.length === 0 && filteredSingles.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <>
                {/* Batches Section */}
                {filteredBatches.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Batches ({filteredBatches.length})
                    </h3>
                    <div className="space-y-3">
                      {filteredBatches.map((batch) => (
                        <BatchHistoryItem
                          key={batch.id}
                          batch={batch}
                          onDelete={deleteBatch}
                          onViewGeneration={setSelectedGeneration}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Singles Section */}
                {filteredSingles.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Single Files ({filteredSingles.length})
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {paginatedSingles.map((generation) => (
                        <HistoryItem
                          key={generation.id}
                          generation={generation}
                          onDelete={handleDelete}
                          onView={setSelectedGeneration}
                          variant="grid"
                        />
                      ))}
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-4">
            {filteredBatches.length === 0 ? (
              <EmptyState search={search} message="No batches found" />
            ) : (
              <div className="space-y-3">
                {filteredBatches.map((batch) => (
                  <BatchHistoryItem
                    key={batch.id}
                    batch={batch}
                    onDelete={deleteBatch}
                    onViewGeneration={setSelectedGeneration}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Singles Tab */}
          <TabsContent value="singles" className="space-y-4">
            {filteredSingles.length === 0 ? (
              <EmptyState search={search} message="No single files found" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedSingles.map((generation) => (
                    <HistoryItem
                      key={generation.id}
                      generation={generation}
                      onDelete={handleDelete}
                      onView={setSelectedGeneration}
                      variant="grid"
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </AnimatedSection>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedGeneration && !showRegenerateDialog}
        onOpenChange={() => setSelectedGeneration(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGeneration && (
                <>
                  <img
                    src={selectedGeneration.imageUrl}
                    alt={selectedGeneration.fileName}
                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                  />
                  {isEditingName ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8 text-base font-semibold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveDisplayName();
                          if (e.key === "Escape") cancelEditingName();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={saveDisplayName}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={cancelEditingName}
                      >
                        <X className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{getDisplayName(selectedGeneration)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={startEditingName}
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedGeneration && (
            <div className="mt-4 space-y-4">
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={openRegenerateDialog}
                  className="rounded-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Metadata
                </Button>
              </div>

              {selectedGeneration.marketplaces.map((mp) => (
                <MetadataCard
                  key={mp.name}
                  marketplace={mp.name}
                  title={mp.title}
                  description={mp.description}
                  keywords={mp.keywords}
                  color={MARKETPLACE_COLORS[mp.name] || "bg-gray-500"}
                  onKeywordsChange={async (newKeywords) => {
                    try {
                      await updateMarketplaceKeywords(selectedGeneration.id, mp.name, newKeywords);
                      setSelectedGeneration(prev => prev ? {
                        ...prev,
                        marketplaces: prev.marketplaces.map(m => 
                          m.name === mp.name ? { ...m, keywords: newKeywords } : m
                        )
                      } : null);
                      toast.success("Keyword removed");
                    } catch {
                      toast.error("Failed to update keywords");
                    }
                  }}
                  onDownload={() => handleDownloadForMarketplace(selectedGeneration, mp.name)}
                  showDownload
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Regenerate Metadata</DialogTitle>
            <DialogDescription>
              Select the marketplaces you want to regenerate metadata for. This will use {regenerateMarketplaces.length} credit{regenerateMarketplaces.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <MarketplaceSelector
              selected={regenerateMarketplaces}
              onChange={setRegenerateMarketplaces}
            />
          </div>

          {!isAdmin && !user.hasUnlimitedCredits && user.credits < regenerateMarketplaces.length && (
            <p className="text-sm text-destructive">
              Not enough credits. You have {user.credits} credit{user.credits !== 1 ? "s" : ""} but need {regenerateMarketplaces.length}.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button
              variant="cta"
              onClick={handleRegenerate}
              disabled={isRegenerating || regenerateMarketplaces.length === 0 || (!isAdmin && !user.hasUnlimitedCredits && user.credits < regenerateMarketplaces.length)}
              className="rounded-full"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
