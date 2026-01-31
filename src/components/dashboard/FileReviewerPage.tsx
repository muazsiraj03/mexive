import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Upload, History, FileSearch, CheckCircle2, AlertTriangle, XCircle, Loader2, FolderOpen, Download, LayoutGrid, List, ChevronLeft, ChevronRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ToolStatsBar } from "./ToolStatsBar";
import { ToolAccessGate } from "./ToolAccessGate";
import { ReviewResultCard } from "@/components/dashboard/ReviewResultCard";
import { useFileReviews } from "@/hooks/use-file-reviews";
import { isSupportedFileType, type PendingReview, type FileReview } from "@/lib/file-reviewer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

const MARKETPLACES = [
  { id: "Adobe Stock", label: "Adobe Stock" },
  { id: "Freepik", label: "Freepik" },
  { id: "Shutterstock", label: "Shutterstock" },
];

const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.svg,.mp4,.webm,.mov";

export function FileReviewerPage() {
  const {
    pendingReviews,
    reviewHistory,
    isLoadingHistory,
    processingCount,
    addFiles,
    removePending,
    clearPending,
    startReview,
    fetchHistory,
    deleteReview,
    getSummary,
  } = useFileReviews();

  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([
    "Adobe Stock",
    "Freepik",
    "Shutterstock",
  ]);
  const [activeTab, setActiveTab] = useState("review");
  const [resultsFilter, setResultsFilter] = useState<"all" | "approvable" | "improvable" | "rejectable">("all");
  const [historyFilter, setHistoryFilter] = useState<"all" | "approvable" | "improvable" | "rejectable">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingPending, setIsDownloadingPending] = useState(false);
  const [isDownloadingHistory, setIsDownloadingHistory] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [historyViewMode, setHistoryViewMode] = useState<"list" | "grid">("list");
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const ITEMS_PER_PAGE_LIST = 6;
  const ITEMS_PER_PAGE_GRID = 12;

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const summary = getSummary();

  // Filter completed reviews by verdict
  const filteredReviews = useMemo(() => {
    if (resultsFilter === "all") return pendingReviews;
    if (resultsFilter === "approvable") {
      return pendingReviews.filter(
        (p) => p.status === "completed" && p.result?.verdict === "pass"
      );
    }
    if (resultsFilter === "improvable") {
      return pendingReviews.filter(
        (p) => p.status === "completed" && p.result?.verdict === "warning"
      );
    }
    if (resultsFilter === "rejectable") {
      return pendingReviews.filter(
        (p) => p.status === "completed" && p.result?.verdict === "fail"
      );
    }
    return pendingReviews;
  }, [pendingReviews, resultsFilter]);

  // Count for filter badges
  const filterCounts = useMemo(() => {
    const completed = pendingReviews.filter((p) => p.status === "completed");
    return {
      all: pendingReviews.length,
      approvable: completed.filter((p) => p.result?.verdict === "pass").length,
      improvable: completed.filter((p) => p.result?.verdict === "warning").length,
      rejectable: completed.filter((p) => p.result?.verdict === "fail").length,
    };
  }, [pendingReviews]);

  // Filter history by verdict
  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return reviewHistory;
    if (historyFilter === "approvable") {
      return reviewHistory.filter((r) => r.verdict === "pass");
    }
    if (historyFilter === "improvable") {
      return reviewHistory.filter((r) => r.verdict === "warning");
    }
    if (historyFilter === "rejectable") {
      return reviewHistory.filter((r) => r.verdict === "fail");
    }
    return reviewHistory;
  }, [reviewHistory, historyFilter]);

  // Count for history filter badges
  const historyFilterCounts = useMemo(() => {
    return {
      all: reviewHistory.length,
      approvable: reviewHistory.filter((r) => r.verdict === "pass").length,
      improvable: reviewHistory.filter((r) => r.verdict === "warning").length,
      rejectable: reviewHistory.filter((r) => r.verdict === "fail").length,
    };
  }, [reviewHistory]);

  // Reset page when filter changes
  useEffect(() => {
    setPendingPage(1);
  }, [resultsFilter, viewMode]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter, historyViewMode]);

  // Pagination calculations for pending reviews
  const pendingItemsPerPage = viewMode === "grid" ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;
  const pendingTotalPages = Math.ceil(filteredReviews.length / pendingItemsPerPage);
  const paginatedPendingReviews = useMemo(() => {
    const start = (pendingPage - 1) * pendingItemsPerPage;
    return filteredReviews.slice(start, start + pendingItemsPerPage);
  }, [filteredReviews, pendingPage, pendingItemsPerPage]);

  // Pagination calculations for history
  const historyItemsPerPage = historyViewMode === "grid" ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;
  const historyTotalPages = Math.ceil(filteredHistory.length / historyItemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyItemsPerPage;
    return filteredHistory.slice(start, start + historyItemsPerPage);
  }, [filteredHistory, historyPage, historyItemsPerPage]);

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

  const handleFilesAdded = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const supported = files.filter((f) => isSupportedFileType(f.name));
      const unsupported = files.filter((f) => !isSupportedFileType(f.name));

      if (unsupported.length > 0) {
        toast.warning(
          `${unsupported.length} file(s) skipped. EPS/AI files cannot be analyzed directly.`
        );
      }

      if (supported.length > 0) {
        addFiles(supported);
        toast.success(`${supported.length} file(s) added for review`);
      }
    },
    [addFiles]
  );

  const handleStartReview = () => {
    if (selectedMarketplaces.length === 0) {
      toast.error("Please select at least one marketplace");
      return;
    }
    startReview(selectedMarketplaces);
  };

  const toggleMarketplace = (marketplace: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(marketplace)
        ? prev.filter((m) => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFilesAdded(e.dataTransfer.files);
      }
    },
    [handleFilesAdded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFilesAdded(e.target.files);
        e.target.value = "";
      }
    },
    [handleFilesAdded]
  );

  // Download all files from pending reviews (current filter)
  const handleDownloadPending = useCallback(async () => {
    const filesToDownload = filteredReviews.filter(
      (p) => p.status === "completed" || p.status === "pending"
    );

    if (filesToDownload.length === 0) {
      toast.info("No files to download");
      return;
    }

    setIsDownloadingPending(true);
    const toastId = toast.loading(`Preparing ${filesToDownload.length} file(s) for download...`);

    try {
      const zip = new JSZip();
      let addedCount = 0;

      for (const pending of filesToDownload) {
        try {
          // Get the file blob from the pending review
          const response = await fetch(pending.previewUrl);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          zip.file(pending.file.name, blob);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add ${pending.file.name}:`, error);
        }
      }

      if (addedCount === 0) {
        toast.error("No files could be added to the download", { id: toastId });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `file-reviewer-${resultsFilter}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${addedCount} file(s)`, { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to create download", { id: toastId });
    } finally {
      setIsDownloadingPending(false);
    }
  }, [filteredReviews, resultsFilter]);

  // Download all files from history (current filter)
  const handleDownloadHistory = useCallback(async () => {
    if (filteredHistory.length === 0) {
      toast.info("No files to download");
      return;
    }

    setIsDownloadingHistory(true);
    const toastId = toast.loading(`Preparing ${filteredHistory.length} file(s) for download...`);

    try {
      const zip = new JSZip();
      let addedCount = 0;

      for (const review of filteredHistory) {
        try {
          const response = await fetch(review.image_url);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          zip.file(review.file_name, blob);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add ${review.file_name}:`, error);
        }
      }

      if (addedCount === 0) {
        toast.error("No files could be added to the download", { id: toastId });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `file-reviewer-history-${historyFilter}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${addedCount} file(s)`, { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to create download", { id: toastId });
    } finally {
      setIsDownloadingHistory(false);
    }
  }, [filteredHistory, historyFilter]);

  return (
    <ToolAccessGate toolId="file-reviewer">
      <DashboardHeader
        title="File Reviewer"
        description="AI-powered analysis to check your files before marketplace submission"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="space-y-6">
        <DashboardBreadcrumb />

        {/* Stats Bar */}
        <AnimatedSection variant="fade-up">
          <ToolStatsBar stats={[
            { label: "Files Reviewed", value: reviewHistory.length, icon: FileCheck },
            { label: "Pass Rate", value: reviewHistory.length > 0 ? `${Math.round((reviewHistory.filter(r => r.verdict === "pass").length / reviewHistory.length) * 100)}%` : "N/A", icon: CheckCircle2 },
          ]} />
        </AnimatedSection>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="review" className="gap-2">
              <FileSearch className="h-4 w-4" />
              Review Files
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
              {reviewHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {reviewHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6 mt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <AnimatedSection variant="fade-up">
                  <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                    <h2 className="text-lg font-semibold text-foreground">Upload Files</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Supports JPG, PNG, WEBP, SVG, MP4, MOV, WEBM. EPS/AI files need PNG/JPG preview.
                    </p>

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      multiple
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      onChange={handleInputChange}
                      className="hidden"
                      {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                    />

                    {/* Upload Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                        onClick={() => folderInputRef.current?.click()}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Upload Folder
                      </Button>
                    </div>

                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "mt-4 relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        Or drag and drop files here
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WEBP, SVG, MP4, MOV, WEBM
                      </p>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Pending Reviews with Filter Tabs */}
                {pendingReviews.length > 0 && (
                  <AnimatedSection variant="fade-up" delay={100}>
                    <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                          Files to Review ({pendingReviews.length})
                        </h2>
                        <Button variant="ghost" size="sm" onClick={clearPending}>
                          Clear All
                        </Button>
                      </div>

                      {/* Filter Tabs for Results */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <Tabs value={resultsFilter} onValueChange={(v) => setResultsFilter(v as typeof resultsFilter)}>
                          <TabsList className="h-9">
                            <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                              All
                              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                {filterCounts.all}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="approvable" className="text-xs px-3 gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Approvable
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {filterCounts.approvable}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="improvable" className="text-xs px-3 gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                              Improvable
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {filterCounts.improvable}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="rejectable" className="text-xs px-3 gap-1.5">
                              <XCircle className="h-3 w-3 text-destructive" />
                              Rejectable
                              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {filterCounts.rejectable}
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

                          {filteredReviews.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadPending}
                              disabled={isDownloadingPending}
                              className="shrink-0 mr-4"
                            >
                              {isDownloadingPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Download ({filteredReviews.length})
                            </Button>
                          )}
                        </div>
                      </div>

                      <ScrollArea className="h-[400px]">
                        <div className={cn(
                          "pr-4",
                          viewMode === "list" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                        )}>
                          {filteredReviews.length === 0 ? (
                            <div className={cn(
                              "flex flex-col items-center justify-center py-8 text-center",
                              viewMode === "grid" && "col-span-full"
                            )}>
                              <p className="text-muted-foreground text-sm">
                                No {resultsFilter === "approvable" ? "approvable" : resultsFilter === "improvable" ? "improvable" : resultsFilter === "rejectable" ? "rejectable" : ""} files
                              </p>
                            </div>
                          ) : (
                            paginatedPendingReviews.map((pending, index) => {
                              // Find original index for deletion
                              const originalIndex = pendingReviews.indexOf(pending);
                              return (
                                <ReviewResultCard
                                  key={index}
                                  review={pending}
                                  onDelete={() => removePending(originalIndex)}
                                  showViewDetails
                                  compact={viewMode === "grid"}
                                />
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>

                      {/* Pagination */}
                      {pendingTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                            disabled={pendingPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {getPageNumbers(pendingPage, pendingTotalPages).map((page, i) =>
                            page === "ellipsis" ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                            ) : (
                              <Button
                                key={page}
                                variant={pendingPage === page ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPendingPage(page)}
                              >
                                {page}
                              </Button>
                            )
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPendingPage((p) => Math.min(pendingTotalPages, p + 1))}
                            disabled={pendingPage === pendingTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AnimatedSection>
                )}
              </div>

              {/* Controls Section */}
              <div className="space-y-6">
                <AnimatedSection variant="fade-up" delay={50}>
                  {/* Marketplace Selection */}
                  <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                    <h2 className="text-lg font-semibold text-foreground">Target Marketplaces</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select which marketplaces to check against
                    </p>
                    <div className="space-y-3 mt-4">
                      {MARKETPLACES.map((marketplace) => (
                        <div key={marketplace.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={marketplace.id}
                            checked={selectedMarketplaces.includes(marketplace.id)}
                            onCheckedChange={() => toggleMarketplace(marketplace.id)}
                          />
                          <Label htmlFor={marketplace.id} className="cursor-pointer">
                            {marketplace.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>

                {/* Summary Stats */}
                {pendingReviews.length > 0 && (
                  <AnimatedSection variant="fade-up" delay={100}>
                    <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Review Summary</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          <span>Pending: {summary.pending}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span>Processing: {summary.processing}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
                          <span>Passed: {summary.passed}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                          <span>Warnings: {summary.warnings}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span>Failed: {summary.failed}</span>
                        </div>
                        {summary.errors > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span>Errors: {summary.errors}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                )}

                {/* Start Review Button */}
                <AnimatedSection variant="fade-up" delay={150}>
                  <Button
                    onClick={handleStartReview}
                    disabled={summary.pending === 0 || processingCount > 0}
                    className="w-full gap-2 rounded-full"
                    size="lg"
                  >
                    {processingCount > 0 ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reviewing...
                      </>
                    ) : (
                      <>
                        <FileSearch className="h-4 w-4" />
                        Start Review ({summary.pending} file{summary.pending !== 1 ? "s" : ""})
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Each file review consumes 1 credit
                  </p>
                </AnimatedSection>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <AnimatedSection variant="fade-up">
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h2 className="text-lg font-semibold text-foreground">Review History</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your past file reviews and their results
                </p>

                {/* History Filter Tabs */}
                {reviewHistory.length > 0 && (
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <Tabs value={historyFilter} onValueChange={(v) => setHistoryFilter(v as typeof historyFilter)}>
                      <TabsList className="h-9">
                        <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                          All
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {historyFilterCounts.all}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="approvable" className="text-xs px-3 gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Approvable
                          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {historyFilterCounts.approvable}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="improvable" className="text-xs px-3 gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          Improvable
                          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {historyFilterCounts.improvable}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="rejectable" className="text-xs px-3 gap-1.5">
                          <XCircle className="h-3 w-3 text-destructive" />
                          Rejectable
                          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {historyFilterCounts.rejectable}
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
                          onClick={() => setHistoryViewMode("list")}
                          className={cn("h-8 px-2 rounded-r-none", historyViewMode === "list" && "bg-muted")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistoryViewMode("grid")}
                          className={cn("h-8 px-2 rounded-l-none", historyViewMode === "grid" && "bg-muted")}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>

                      {filteredHistory.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadHistory}
                          disabled={isDownloadingHistory}
                          className="shrink-0 mr-4"
                        >
                          {isDownloadingHistory ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download ({filteredHistory.length})
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : reviewHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No review history yet</p>
                      <p className="text-sm text-muted-foreground">
                        Upload and review files to see them here
                      </p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        No {historyFilter === "approvable" ? "approvable" : historyFilter === "improvable" ? "improvable" : "rejectable"} files in history
                      </p>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="h-[600px]">
                        <div className={cn(
                          "pr-4",
                          historyViewMode === "list" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                        )}>
                          {paginatedHistory.map((review) => (
                            <ReviewResultCard
                              key={review.id}
                              review={review}
                              onDelete={() => deleteReview(review.id)}
                              showViewDetails
                              compact={historyViewMode === "grid"}
                            />
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Pagination */}
                      {historyTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {getPageNumbers(historyPage, historyTotalPages).map((page, i) =>
                            page === "ellipsis" ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                            ) : (
                              <Button
                                key={page}
                                variant={historyPage === page ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setHistoryPage(page)}
                              >
                                {page}
                              </Button>
                            )
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                            disabled={historyPage === historyTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </ToolAccessGate>
  );
}