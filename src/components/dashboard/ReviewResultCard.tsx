import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle, Trash2, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileReviewResult, ReviewIssue, PendingReview, FileReview } from "@/lib/file-reviewer";
import { getVerdictColor, getSeverityColor, getScoreColor } from "@/lib/file-reviewer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewResultCardProps {
  review: PendingReview | FileReview;
  onDelete?: () => void;
  showImage?: boolean;
  showViewDetails?: boolean;
  compact?: boolean;
}

export function ReviewResultCard({ review, onDelete, showImage = true, showViewDetails = false, compact = false }: ReviewResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMarketplace, setActiveMarketplace] = useState("Adobe Stock");

  // Determine if this is a pending review or saved review
  const isPending = "file" in review;
  const result = isPending ? review.result : null;
  const status = isPending ? review.status : "completed";
  const previewUrl = isPending ? review.previewUrl : (review as FileReview).image_url;
  const fileName = isPending ? review.file.name : (review as FileReview).file_name;
  const fileType = isPending ? review.file.name.split(".").pop()?.toUpperCase() : (review as FileReview).file_type?.toUpperCase();

  // Get data from saved review
  const savedReview = !isPending ? (review as FileReview) : null;
  const overallScore = result?.overallScore ?? savedReview?.overall_score ?? 0;
  const verdict = result?.verdict ?? savedReview?.verdict ?? "pending";
  const issues = (result?.issues ?? savedReview?.issues ?? []) as ReviewIssue[];
  const suggestions = (result?.suggestions ?? savedReview?.suggestions ?? []) as string[];
  const marketplaceNotes = result?.marketplaceNotes ?? savedReview?.marketplace_notes ?? {};

  const VerdictIcon = verdict === "pass" ? CheckCircle2 : verdict === "warning" ? AlertTriangle : XCircle;

  // Generate verdict explanation
  const getVerdictExplanation = () => {
    if (verdict === "pass") {
      return {
        title: "Likely to be Approved",
        description: "This file meets marketplace quality standards and should be accepted by most stock platforms.",
      };
    } else if (verdict === "warning") {
      return {
        title: "May Need Improvements",
        description: "This file has some minor issues that could lead to rejection. Consider fixing the issues listed below.",
      };
    } else {
      return {
        title: "Likely to be Rejected",
        description: "This file has significant issues that will likely cause rejection. Please fix the issues below before submitting.",
      };
    }
  };

  const verdictExplanation = getVerdictExplanation();

  // Download the original file
  const handleDownload = async () => {
    try {
      // For pending reviews, download from blob URL
      if (isPending && review.file) {
        const url = URL.createObjectURL(review.file);
        const a = document.createElement("a");
        a.href = url;
        a.download = review.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("File downloaded");
        return;
      }
      
      // For saved reviews, download from the image URL
      if (previewUrl) {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error("Failed to fetch file");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("File downloaded");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  // Detailed view dialog content
  const DetailedViewContent = () => (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 pr-4">
        {/* File Preview */}
        <div className="flex items-start gap-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
            <img
              src={previewUrl}
              alt={fileName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{fileName}</p>
            <Badge variant="outline" className="mt-1">
              {fileType}
            </Badge>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={cn("gap-1 capitalize", getVerdictColor(verdict))}>
                <VerdictIcon className="h-3.5 w-3.5" />
                {verdict}
              </Badge>
              <div className="flex items-center gap-1">
                <span className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
                  {overallScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Explanation */}
        <div className={cn(
          "p-4 rounded-lg border-l-4",
          verdict === "pass" && "bg-green-50 border-green-500 dark:bg-green-900/20",
          verdict === "warning" && "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20",
          verdict === "fail" && "bg-red-50 border-red-500 dark:bg-red-900/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <VerdictIcon className={cn(
              "h-5 w-5",
              verdict === "pass" && "text-green-600",
              verdict === "warning" && "text-yellow-600",
              verdict === "fail" && "text-red-600"
            )} />
          <h3 className="font-semibold">{verdictExplanation.title}</h3>
        </div>
        <p className="text-sm text-foreground/80">{verdictExplanation.description}</p>
      </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Issues Found ({issues.length})
            </h4>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-start gap-2">
                    <Badge className={cn("shrink-0 text-xs", getSeverityColor(issue.severity))}>
                      {issue.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{issue.message}</p>
                      {issue.details && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 border-muted-foreground/30">
                          {issue.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Improvement Suggestions
            </h4>
            <ul className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Marketplace Notes */}
        {Object.keys(marketplaceNotes).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Marketplace-Specific Notes</h4>
            <Tabs value={activeMarketplace} onValueChange={setActiveMarketplace}>
              <TabsList className="h-9 w-full justify-start">
                {Object.keys(marketplaceNotes).map((marketplace) => (
                  <TabsTrigger key={marketplace} value={marketplace} className="text-xs px-3">
                    {marketplace}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(marketplaceNotes).map(([marketplace, note]) => (
                <TabsContent key={marketplace} value={marketplace} className="mt-3">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm">{note}</p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {issues.length === 0 && verdict === "pass" && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>No issues detected. This file should be accepted by most marketplaces.</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  // Compact grid view
  if (compact) {
    return (
      <Card className="overflow-hidden group">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {status === "processing" ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={fileName}
              className="h-full w-full object-cover"
            />
          )}
          {/* Verdict overlay */}
          {status === "completed" && (
            <div className={cn(
              "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              getVerdictColor(verdict)
            )}>
              <VerdictIcon className="h-3 w-3" />
              {overallScore}
            </div>
          )}
          {/* Actions overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {status === "completed" && showViewDetails && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Review Details</DialogTitle>
                  </DialogHeader>
                  <DetailedViewContent />
                </DialogContent>
              </Dialog>
            )}
            {status === "completed" && (
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate" title={fileName}>{fileName}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          {showImage && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
              {status === "processing" ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate text-sm">{fileName}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {fileType}
              </Badge>
            </div>

            {status === "processing" && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Analyzing...</p>
                <Progress value={undefined} className="h-1" />
              </div>
            )}

            {status === "error" && isPending && (
              <p className="text-xs text-destructive mt-1">{review.error}</p>
            )}

            {status === "completed" && (
              <div className="flex items-center gap-3 mt-2">
                <Badge className={cn("gap-1 capitalize", getVerdictColor(verdict))}>
                  <VerdictIcon className="h-3 w-3" />
                  {verdict}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className={cn("text-lg font-bold", getScoreColor(overallScore))}>
                    {overallScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {status === "completed" && showViewDetails && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Review Details</DialogTitle>
                  </DialogHeader>
                  <DetailedViewContent />
                </DialogContent>
              </Dialog>
            )}
            {status === "completed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {status === "completed" && !showViewDetails && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content (for inline expansion, not dialog) */}
      {!showViewDetails && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <CardContent className="pt-2 pb-4 space-y-4">
              {/* Verdict Explanation */}
              <div className={cn(
                "p-3 rounded-lg border-l-4",
                verdict === "pass" && "bg-green-50 border-green-500 dark:bg-green-900/20",
                verdict === "warning" && "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20",
                verdict === "fail" && "bg-red-50 border-red-500 dark:bg-red-900/20"
              )}>
                <p className="text-sm font-medium">{verdictExplanation.title}</p>
              </div>

              {/* Issues */}
              {issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Issues Found ({issues.length})</h4>
                  <div className="space-y-2">
                    {issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        <Badge className={cn("shrink-0 text-xs", getSeverityColor(issue.severity))}>
                          {issue.severity}
                        </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{issue.message}</p>
                        {issue.details && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{issue.details}</p>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Marketplace Notes */}
              {Object.keys(marketplaceNotes).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Marketplace Notes</h4>
                  <Tabs value={activeMarketplace} onValueChange={setActiveMarketplace}>
                    <TabsList className="h-8">
                      {Object.keys(marketplaceNotes).map((marketplace) => (
                        <TabsTrigger key={marketplace} value={marketplace} className="text-xs px-2 h-6">
                          {marketplace}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {Object.entries(marketplaceNotes).map(([marketplace, note]) => (
                      <TabsContent key={marketplace} value={marketplace} className="mt-2">
                        <p className="text-sm text-muted-foreground">{note}</p>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}

              {issues.length === 0 && verdict === "pass" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No issues detected. This file should be accepted by most marketplaces.</span>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}