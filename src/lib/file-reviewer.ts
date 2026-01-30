/**
 * File Reviewer types and utilities
 */

export interface ReviewIssue {
  code: string;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  details?: string;
}

export interface FileReviewResult {
  overallScore: number;
  verdict: "pass" | "warning" | "fail";
  issues: ReviewIssue[];
  suggestions: string[];
  marketplaceNotes: {
    "Adobe Stock"?: string;
    "Freepik"?: string;
    "Shutterstock"?: string;
    [key: string]: string | undefined;
  };
}

export interface FileReview {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  image_url: string;
  overall_score: number;
  verdict: string;
  issues: ReviewIssue[];
  suggestions: string[];
  marketplace_notes: Record<string, string>;
  created_at: string;
}

export interface PendingReview {
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: FileReviewResult;
  error?: string;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

/**
 * Check if file type is supported for review
 */
export function isSupportedFileType(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  const supportedTypes = [
    // Raster
    "jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "tiff",
    // Vector
    "svg",
    // Video
    "mp4", "mov", "webm",
  ];
  return supportedTypes.includes(ext);
}

/**
 * Check if file type requires conversion before AI analysis
 */
export function requiresConversion(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  // SVG and video need to be converted to image
  return ["svg", "mp4", "mov", "webm", "avi", "wmv"].includes(ext);
}

/**
 * Check if file type cannot be analyzed in browser
 */
export function isUnsupportedForBrowser(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  // EPS and AI files cannot be processed in browser
  return ["eps", "ai"].includes(ext);
}

/**
 * Get verdict color class
 */
export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case "pass":
      return "text-green-600 bg-green-100 border-green-200";
    case "warning":
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case "fail":
      return "text-red-600 bg-red-100 border-red-200";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "high":
      return "text-red-600 bg-red-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-muted-foreground bg-muted";
  }
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
