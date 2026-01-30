import { useState, useMemo, useEffect } from "react";
import { Wand2, Loader2, HelpCircle, CheckCircle2, XCircle, AlertCircle, LayoutGrid, List, Download, ChevronLeft, ChevronRight, Eye, History, Sparkles, Images, TrendingUp } from "lucide-react";
import { HistoryTabContent } from "./HistoryTabContent";
import { ToolStatsBar } from "./ToolStatsBar";
import { ToolAccessGate } from "./ToolAccessGate";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { ImageUploader, UploadedFile } from "./ImageUploader";
import { MarketplaceSelector, MARKETPLACES } from "./MarketplaceSelector";
import { MetadataCard } from "./MetadataCard";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useDashboard, GenerationResult } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processFileForAnalysis } from "@/lib/file-processor";
import { generateSEOFilename } from "@/lib/seo-filename";
import { downloadAllAsZip, getFileExtension } from "@/lib/file-downloader";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GeneratedMetadata {
  marketplace: string;
  title: string;
  description: string;
  keywords: string[];
  color: string;
}

interface BatchGenerationResult {
  fileId: string;
  fileName: string;
  imageUrl: string;
  results: GeneratedMetadata[];
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

type ResultsFilter = "all" | "success" | "error";
type MainTab = "generate" | "history";

export function GeneratePage() {
  const { user, addGeneration, createBatch, isAdmin, generations } = useDashboard();
  const { user: authUser } = useAuth();
  
  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>("generate");
  
  // Generate tab state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([
    "adobe",
    "shutterstock",
  ]);
  const [keywordCount, setKeywordCount] = useState(30);
  const [titleMaxChars, setTitleMaxChars] = useState(200);
  const [descriptionMaxChars, setDescriptionMaxChars] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchGenerationResult[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  
  // Results filter state (for current batch)
  const [resultsFilter, setResultsFilter] = useState<ResultsFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [resultsPage, setResultsPage] = useState(1);
  const [isDownloadingFiltered, setIsDownloadingFiltered] = useState(false);

  // Batch result details dialog
  const [selectedBatchResult, setSelectedBatchResult] = useState<BatchGenerationResult | null>(null);

  const ITEMS_PER_PAGE_LIST = 6;
  const ITEMS_PER_PAGE_GRID = 12;

  const DIRECTLY_ANALYZABLE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  
  const canProcessFile = (file: UploadedFile) => {
    const isVideoFile = file.type === "video" || file.file.type.startsWith("video/");
    const isSvgFile = file.file.type === "image/svg+xml" || file.file.name.endsWith(".svg");
    const isDirectlyAnalyzable = DIRECTLY_ANALYZABLE.includes(file.file.type);
    const isEpsOrAi = file.file.name.match(/\.(eps|ai)$/i);
    return (isDirectlyAnalyzable || isSvgFile || isVideoFile) && !isEpsOrAi;
  };

  const processableFiles = files.filter(canProcessFile);
  const hasUnprocessableFiles = files.length > processableFiles.length;
  const totalCreditsNeeded = processableFiles.length * selectedMarketplaces.length;
  const canGenerate = processableFiles.length > 0 && selectedMarketplaces.length > 0 && (isAdmin || user.credits >= totalCreditsNeeded);

  const successfulResults = batchResults.filter((r) => r.status === "success");
  const errorResults = batchResults.filter((r) => r.status === "error");
  const hasResults = successfulResults.length > 0;

  // Stats for the tool bar
  const totalImages = generations.length;
  const totalKeywords = generations.reduce(
    (acc, g) => acc + g.marketplaces.reduce((a, m) => a + m.keywords.length, 0),
    0
  );
  const toolStats = [
    { label: "Images Processed", value: totalImages, icon: Images },
    { label: "Keywords Generated", value: totalKeywords, icon: TrendingUp },
  ];

  // Filter counts for current batch
  const filterCounts = useMemo(() => ({
    all: batchResults.length,
    success: successfulResults.length,
    error: errorResults.length,
  }), [batchResults, successfulResults, errorResults]);

  // Filtered results based on filter
  const filteredResults = useMemo(() => {
    if (resultsFilter === "all") return batchResults;
    if (resultsFilter === "success") return successfulResults;
    if (resultsFilter === "error") return errorResults;
    return batchResults;
  }, [batchResults, successfulResults, errorResults, resultsFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setResultsPage(1);
  }, [resultsFilter, viewMode]);

  // Pagination for current batch
  const itemsPerPage = viewMode === "grid" ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (resultsPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, resultsPage, itemsPerPage]);

  // Generate page numbers with ellipsis
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  // Download filtered results as ZIP
  const handleDownloadFiltered = async () => {
    const toDownload = filteredResults.filter((r) => r.status === "success");
    if (toDownload.length === 0) {
      toast.info("No successful files to download");
      return;
    }

    setIsDownloadingFiltered(true);
    const toastId = toast.loading(`Preparing ${toDownload.length} file(s) for download...`);

    try {
      const zip = new JSZip();

      for (const batch of toDownload) {
        for (const result of batch.results) {
          try {
            const response = await fetch(batch.imageUrl);
            if (!response.ok) continue;
            const blob = await response.blob();
            const filename = generateSEOFilename({
              title: result.title,
              keywords: result.keywords,
              marketplace: result.marketplace,
              originalExtension: getFileExtension(batch.fileName),
            });
            zip.file(`${result.marketplace}/${filename}`, blob);
          } catch (error) {
            console.error(`Failed to add ${batch.fileName}:`, error);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metadata-${resultsFilter}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${toDownload.length} file(s)`, { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to create download", { id: toastId });
    } finally {
      setIsDownloadingFiltered(false);
    }
  };

  const uploadProcessedFile = async (blob: Blob): Promise<string | null> => {
    if (!authUser) return null;

    const ext = blob.type === "image/png" ? "png" : "jpg";
    const fileName = `${authUser.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const { error } = await supabase.storage
      .from("generation-images")
      .upload(fileName, blob, { contentType: blob.type });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("generation-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const processFile = async (
    file: UploadedFile,
    marketplaceNames: string[]
  ): Promise<{ imageUrl: string; results: GeneratedMetadata[] } | null> => {
    // Process the file
    let processedBlob: Blob;
    try {
      const result = await processFileForAnalysis(file.file);
      processedBlob = result.blob;
    } catch (conversionError) {
      throw new Error(conversionError instanceof Error ? conversionError.message : "Failed to process file");
    }

    // Upload
    const imageUrl = await uploadProcessedFile(processedBlob);
    if (!imageUrl) {
      throw new Error("Failed to upload image");
    }

    // Call the AI edge function
    const { data, error } = await supabase.functions.invoke("generate-metadata", {
      body: { imageUrl, marketplaces: marketplaceNames, keywordCount, titleMaxChars, descriptionMaxChars },
    });

    if (error) {
      if (error.message?.includes("429") || error.context?.status === 429) {
        throw new Error("Rate limited. Please wait and try again.");
      } else if (error.message?.includes("402") || error.context?.status === 402) {
        throw new Error("AI credits exhausted.");
      }
      throw new Error(error.message || "Failed to generate metadata");
    }

    if (!data?.results || !Array.isArray(data.results)) {
      throw new Error("Could not analyze image");
    }

    const generated: GeneratedMetadata[] = data.results.map((result: { marketplace: string; title: string; description: string; keywords: string[] }) => {
      const mp = MARKETPLACES.find((m) => m.name === result.marketplace);
      return {
        marketplace: result.marketplace,
        color: mp?.color || "hsl(0, 0%, 50%)",
        title: result.title,
        description: result.description || "",
        keywords: result.keywords,
      };
    });

    return { imageUrl, results: generated };
  };

  const handleGenerate = async () => {
    if (!canGenerate || !authUser) return;

    setIsGenerating(true);
    setCurrentFileIndex(0);
    
    // Initialize batch results
    const initialResults: BatchGenerationResult[] = processableFiles.map((file) => ({
      fileId: file.id,
      fileName: file.file.name,
      imageUrl: "",
      results: [],
      status: "pending" as const,
    }));
    setBatchResults(initialResults);

    const marketplaceNames = selectedMarketplaces.map(
      (mpId) => MARKETPLACES.find((m) => m.id === mpId)!.name
    );

    // Create a batch if processing multiple files
    let batchId: string | null = null;
    if (processableFiles.length > 1) {
      const batchName = `Batch ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      batchId = await createBatch(batchName, processableFiles.length);
      setCurrentBatchId(batchId);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process files one by one
    for (let i = 0; i < processableFiles.length; i++) {
      const file = processableFiles[i];
      setCurrentFileIndex(i);
      
      // Update status to processing
      setBatchResults((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: "processing" as const } : r
        )
      );

      try {
        const result = await processFile(file, marketplaceNames);
        
        if (result) {
          // Update with success
          setBatchResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? { ...r, status: "success" as const, imageUrl: result.imageUrl, results: result.results }
                : r
            )
          );

          // Save to database
          let defaultDisplayName: string | null = null;
          try {
            if (result.results[0]) {
              defaultDisplayName = generateSEOFilename({
                title: result.results[0].title,
                keywords: result.results[0].keywords,
                marketplace: result.results[0].marketplace,
                originalExtension: getFileExtension(file.file.name),
              });
            }
          } catch {
            // ignore
          }

          await addGeneration({
            id: `${Date.now()}-${i}`,
            imageUrl: result.imageUrl,
            fileName: file.file.name,
            displayName: defaultDisplayName,
            createdAt: new Date(),
            batchId: batchId,
            marketplaces: result.results.map((g) => ({
              name: g.marketplace,
              title: g.title,
              description: g.description,
              keywords: g.keywords,
            })),
          }, batchId ?? undefined);

          successCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file.file.name}:`, error);
        setBatchResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "error" as const, error: error instanceof Error ? error.message : "Unknown error" }
              : r
          )
        );
        errorCount++;
      }
    }

    setIsGenerating(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success(`Generated metadata for ${successCount} file${successCount > 1 ? "s" : ""}!`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Generated ${successCount} file${successCount > 1 ? "s" : ""}, ${errorCount} failed`);
    } else {
      toast.error("All files failed to process");
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (successfulResults.length === 0) return;

    setIsDownloading(true);
    try {
      // For each successful file, create entries for all marketplaces
      const allEntries: Array<{
        marketplace: string;
        filename: string;
        metadata: { title: string; description: string; keywords: string[] };
        imageUrl: string;
      }> = [];

      successfulResults.forEach((batch) => {
        batch.results.forEach((result) => {
          allEntries.push({
            imageUrl: batch.imageUrl,
            marketplace: result.marketplace,
            filename: generateSEOFilename({
              title: result.title,
              keywords: result.keywords,
              marketplace: result.marketplace,
              originalExtension: getFileExtension(batch.fileName),
            }),
            metadata: {
              title: result.title,
              description: result.description || "",
              keywords: result.keywords,
            },
          });
        });
      });

      // Use first file's results for a single ZIP with all
      if (successfulResults.length === 1) {
        const batch = successfulResults[0];
        const marketplaceFilenames = batch.results.map((r) => ({
          marketplace: r.marketplace,
          filename: generateSEOFilename({
            title: r.title,
            keywords: r.keywords,
            marketplace: r.marketplace,
            originalExtension: getFileExtension(batch.fileName),
          }),
          metadata: {
            title: r.title,
            description: r.description || "",
            keywords: r.keywords,
          },
        }));
        
        const baseFilename = batch.fileName.replace(/\.[^.]+$/, "");
        await downloadAllAsZip(batch.imageUrl, marketplaceFilenames, `${baseFilename}-seo-optimized.zip`);
      } else {
        // Multiple files - create separate ZIPs or a mega ZIP
        const batch = successfulResults[0];
        const marketplaceFilenames = batch.results.map((r) => ({
          marketplace: r.marketplace,
          filename: generateSEOFilename({
            title: r.title,
            keywords: r.keywords,
            marketplace: r.marketplace,
            originalExtension: getFileExtension(batch.fileName),
          }),
          metadata: {
            title: r.title,
            description: r.description || "",
            keywords: r.keywords,
          },
        }));
        
        await downloadAllAsZip(batch.imageUrl, marketplaceFilenames, `batch-${successfulResults.length}-files-seo-optimized.zip`);
        toast.info("Downloaded first file. For multiple files, check History for individual downloads.");
      }

      toast.success("Downloaded ZIP with embedded metadata");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download ZIP");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearResults = () => {
    setBatchResults([]);
    setFiles([]);
    setCurrentFileIndex(0);
  };

  const progress = isGenerating
    ? ((currentFileIndex + 1) / processableFiles.length) * 100
    : hasResults
    ? 100
    : 0;

  // Render pagination controls
  const renderPagination = (
    currentPage: number, 
    total: number, 
    setPage: (page: number) => void
  ) => {
    if (total <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers(currentPage, total).map((page, i) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(Math.min(total, currentPage + 1))}
          disabled={currentPage === total}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <ToolAccessGate toolId="metadata-generator">
      <DashboardHeader
        title="Metadata Generator"
        description="Upload images and generate AI-powered titles & keywords"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
        <DashboardBreadcrumb />

        {/* Stats Bar */}
        <AnimatedSection variant="fade-up">
          <ToolStatsBar stats={toolStats} />
        </AnimatedSection>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="mt-6 space-y-6">
            {/* Upload Section */}
            <AnimatedSection variant="fade-up">
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    1. Upload Files
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Supported Formats</p>
                          <div className="space-y-1">
                            <p className="text-secondary">✓ Ready for AI analysis:</p>
                            <p className="text-muted-foreground pl-3">JPG, PNG, WEBP, GIF</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-secondary">✓ Auto-converted:</p>
                            <p className="text-muted-foreground pl-3">SVG → PNG, Video → Frame</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">⚠ Needs manual export:</p>
                            <p className="text-muted-foreground pl-3">EPS, AI → Export as SVG/PNG</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload files or entire folders for batch processing
                </p>
                <div className="mt-4">
                  <ImageUploader
                    files={files}
                    onFilesChange={setFiles}
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-foreground font-medium">{processableFiles.length} file{processableFiles.length !== 1 ? "s" : ""} ready</span>
                    {hasUnprocessableFiles && (
                      <span className="text-muted-foreground">
                        ({files.length - processableFiles.length} skipped - EPS/AI not supported)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Marketplace Selection */}
            <AnimatedSection variant="fade-up" delay={100}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h2 className="text-lg font-semibold text-foreground">
                  2. Choose Marketplaces
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select which stock platforms to optimize for
                </p>
                <div className="mt-4">
                  <MarketplaceSelector
                    selected={selectedMarketplaces}
                    onChange={setSelectedMarketplaces}
                  />
                </div>
              </div>
            </AnimatedSection>

            {/* Generation Settings */}
            <AnimatedSection variant="fade-up" delay={150}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h2 className="text-lg font-semibold text-foreground">
                  3. Generation Settings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize how metadata is generated
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Title max characters
                      </label>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                        {titleMaxChars}
                      </span>
                    </div>
                    <Slider
                      value={[titleMaxChars]}
                      onValueChange={(values) => setTitleMaxChars(values[0])}
                      min={10}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10</span>
                      <span>100</span>
                      <span>200</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Description max characters
                      </label>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                        {descriptionMaxChars}
                      </span>
                    </div>
                    <Slider
                      value={[descriptionMaxChars]}
                      onValueChange={(values) => setDescriptionMaxChars(values[0])}
                      min={50}
                      max={500}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50</span>
                      <span>250</span>
                      <span>500</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Keywords per marketplace
                      </label>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                        {keywordCount}
                      </span>
                    </div>
                    <Slider
                      value={[keywordCount]}
                      onValueChange={(values) => setKeywordCount(values[0])}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Generate Button */}
            <AnimatedSection variant="fade-up" delay={200}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      4. Generate Metadata
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {processableFiles.length > 0
                        ? `${processableFiles.length} file${processableFiles.length > 1 ? "s" : ""} × ${selectedMarketplaces.length} marketplace${selectedMarketplaces.length > 1 ? "s" : ""} = ${totalCreditsNeeded} credit${totalCreditsNeeded !== 1 ? "s" : ""}`
                        : "Upload files to get started"}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-full px-8"
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing {currentFileIndex + 1}/{processableFiles.length}...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Generate for {processableFiles.length} File{processableFiles.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {(isGenerating || hasResults) && (
                  <div className="mt-4 space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {isGenerating
                        ? `Processing file ${currentFileIndex + 1} of ${processableFiles.length}...`
                        : `Completed: ${successfulResults.length} success, ${batchResults.filter((r) => r.status === "error").length} failed`}
                    </p>
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <AnimatedSection variant="fade-up" delay={250}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Results
                    </h2>
                    <Button
                      variant="ghost"
                      className="rounded-full"
                      onClick={handleClearResults}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Filter Tabs and Controls */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <Tabs value={resultsFilter} onValueChange={(v) => setResultsFilter(v as ResultsFilter)}>
                      <TabsList className="h-9">
                        <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                          All
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {filterCounts.all}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="success" className="text-xs px-3 gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Success
                          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {filterCounts.success}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="error" className="text-xs px-3 gap-1.5">
                          <XCircle className="h-3 w-3 text-destructive" />
                          Error
                          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {filterCounts.error}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                      {/* View Toggle */}
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode("list")}
                          className={cn("h-8 px-2 rounded-r-none", viewMode === "list" && "bg-muted")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className={cn("h-8 px-2 rounded-l-none", viewMode === "grid" && "bg-muted")}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Download Filtered */}
                      {filteredResults.filter((r) => r.status === "success").length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadFiltered}
                          disabled={isDownloadingFiltered}
                          className="shrink-0"
                        >
                          {isDownloadingFiltered ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download ({filteredResults.filter((r) => r.status === "success").length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Results List/Grid */}
                  <ScrollArea className="h-[400px]">
                    <div className={cn(
                      "pr-4",
                      viewMode === "list" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                    )}>
                      {paginatedResults.length === 0 ? (
                        <div className={cn(
                          "flex flex-col items-center justify-center py-8 text-center",
                          viewMode === "grid" && "col-span-full"
                        )}>
                          <p className="text-muted-foreground text-sm">
                            No {resultsFilter === "success" ? "successful" : resultsFilter === "error" ? "failed" : ""} files
                          </p>
                        </div>
                      ) : viewMode === "list" ? (
                        paginatedResults.map((batch, idx) => (
                          <div
                            key={batch.fileId}
                            className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3"
                          >
                            <div className="flex-shrink-0">
                              {batch.status === "pending" && (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">{idx + 1}</span>
                                </div>
                              )}
                              {batch.status === "processing" && (
                                <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                              )}
                              {batch.status === "success" && (
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                              )}
                              {batch.status === "error" && (
                                <XCircle className="h-8 w-8 text-destructive" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{batch.fileName}</p>
                              {batch.status === "success" && (
                                <p className="text-sm text-muted-foreground">
                                  {batch.results.length} marketplace{batch.results.length > 1 ? "s" : ""} generated
                                </p>
                              )}
                              {batch.status === "error" && (
                                <p className="text-sm text-destructive">{batch.error}</p>
                              )}
                              {batch.status === "processing" && (
                                <p className="text-sm text-secondary">Analyzing...</p>
                              )}
                            </div>
                            {batch.status === "success" && batch.imageUrl && (
                              <img
                                src={batch.imageUrl}
                                alt={batch.fileName}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            {batch.status === "success" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBatchResult(batch)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        paginatedResults.map((batch) => (
                          <div
                            key={batch.fileId}
                            className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden group cursor-pointer hover:border-secondary/50 transition-colors"
                            onClick={() => batch.status === "success" && setSelectedBatchResult(batch)}
                          >
                            <div className="relative aspect-square bg-muted">
                              {batch.status === "processing" ? (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                                </div>
                              ) : batch.imageUrl ? (
                                <img
                                  src={batch.imageUrl}
                                  alt={batch.fileName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <XCircle className="h-8 w-8 text-destructive" />
                                </div>
                              )}
                              {/* Status overlay */}
                              <div className={cn(
                                "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                batch.status === "success" && "bg-green-100 text-green-700 dark:bg-green-900/80 dark:text-green-400",
                                batch.status === "error" && "bg-red-100 text-red-700 dark:bg-red-900/80 dark:text-red-400",
                                batch.status === "pending" && "bg-muted text-muted-foreground",
                                batch.status === "processing" && "bg-secondary/20 text-secondary"
                              )}>
                                {batch.status === "success" && <CheckCircle2 className="h-3 w-3" />}
                                {batch.status === "error" && <XCircle className="h-3 w-3" />}
                                {batch.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                                {batch.status === "success" && batch.results.length}
                                {batch.status === "error" && "Error"}
                                {batch.status === "processing" && "..."}
                              </div>
                              {/* View overlay on hover */}
                              {batch.status === "success" && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate" title={batch.fileName}>{batch.fileName}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {renderPagination(resultsPage, totalPages, setResultsPage)}

                </div>
              </AnimatedSection>
            )}

            {/* Credits Info */}
            {!isAdmin && (
              <AnimatedSection variant="fade-up" delay={300}>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground font-medium">Credits Required</p>
                      <p className="text-sm text-muted-foreground">
                        Each file × marketplace uses 1 credit. You have {user.credits} credits available.
                        {totalCreditsNeeded > user.credits && (
                          <span className="text-destructive"> (Need {totalCreditsNeeded - user.credits} more)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <HistoryTabContent />
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Batch Result Details Dialog */}
      <Dialog open={!!selectedBatchResult} onOpenChange={() => setSelectedBatchResult(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedBatchResult && (
                <>
                  <img
                    src={selectedBatchResult.imageUrl}
                    alt={selectedBatchResult.fileName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="truncate">{selectedBatchResult.fileName}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedBatchResult && (
            <div className="grid gap-4 lg:grid-cols-2 mt-4">
              {selectedBatchResult.results.map((result, index) => {
                const mpConfig = MARKETPLACES.find((m) => m.name === result.marketplace);
                return (
                  <MetadataCard
                    key={result.marketplace}
                    marketplace={result.marketplace}
                    color={mpConfig?.color || result.color}
                    title={result.title}
                    description={result.description}
                    keywords={result.keywords}
                    showDownload
                    onTitleChange={(title) => {
                      setBatchResults((prev) =>
                        prev.map((batch) =>
                          batch.fileId === selectedBatchResult.fileId
                            ? {
                                ...batch,
                                results: batch.results.map((r, rIdx) =>
                                  rIdx === index ? { ...r, title } : r
                                ),
                              }
                            : batch
                        )
                      );
                      setSelectedBatchResult((prev) =>
                        prev
                          ? {
                              ...prev,
                              results: prev.results.map((r, rIdx) =>
                                rIdx === index ? { ...r, title } : r
                              ),
                            }
                          : null
                      );
                    }}
                    onDescriptionChange={(description) => {
                      setBatchResults((prev) =>
                        prev.map((batch) =>
                          batch.fileId === selectedBatchResult.fileId
                            ? {
                                ...batch,
                                results: batch.results.map((r, rIdx) =>
                                  rIdx === index ? { ...r, description } : r
                                ),
                              }
                            : batch
                        )
                      );
                      setSelectedBatchResult((prev) =>
                        prev
                          ? {
                              ...prev,
                              results: prev.results.map((r, rIdx) =>
                                rIdx === index ? { ...r, description } : r
                              ),
                            }
                          : null
                      );
                    }}
                    onKeywordsChange={(keywords) => {
                      setBatchResults((prev) =>
                        prev.map((batch) =>
                          batch.fileId === selectedBatchResult.fileId
                            ? {
                                ...batch,
                                results: batch.results.map((r, rIdx) =>
                                  rIdx === index ? { ...r, keywords } : r
                                ),
                              }
                            : batch
                        )
                      );
                      setSelectedBatchResult((prev) =>
                        prev
                          ? {
                              ...prev,
                              results: prev.results.map((r, rIdx) =>
                                rIdx === index ? { ...r, keywords } : r
                              ),
                            }
                          : null
                      );
                    }}
                    onDownload={() => {
                      const filename = generateSEOFilename({
                        title: result.title,
                        keywords: result.keywords,
                        marketplace: result.marketplace,
                        originalExtension: getFileExtension(selectedBatchResult.fileName),
                      });
                      downloadAllAsZip(
                        selectedBatchResult.imageUrl,
                        [{
                          marketplace: result.marketplace,
                          filename,
                          metadata: {
                            title: result.title,
                            description: result.description || "",
                            keywords: result.keywords,
                          },
                        }],
                        `${filename}.zip`
                      );
                    }}
                  />
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ToolAccessGate>
  );
}
