import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processFileForAnalysis } from "@/lib/file-processor";
import type { FileReview, FileReviewResult, PendingReview } from "@/lib/file-reviewer";
import { getFileExtension, isUnsupportedForBrowser } from "@/lib/file-reviewer";

const SUPABASE_URL = "https://cznvtcvzotilcxajcflw.supabase.co";

export function useFileReviews() {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [reviewHistory, setReviewHistory] = useState<FileReview[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);

  // Fetch review history
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("file_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Cast the data to proper types
      const typedData = (data || []).map((item: any) => ({
        ...item,
        issues: item.issues as FileReview["issues"],
        suggestions: item.suggestions as string[],
        marketplace_notes: item.marketplace_notes as Record<string, string>,
      }));

      setReviewHistory(typedData);
    } catch (error) {
      console.error("Error fetching review history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Add files to pending queue
  const addFiles = useCallback((files: File[]) => {
    const newPending: PendingReview[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setPendingReviews((prev) => [...prev, ...newPending]);
  }, []);

  // Remove a pending review
  const removePending = useCallback((index: number) => {
    setPendingReviews((prev) => {
      const item = prev[index];
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Clear all pending reviews
  const clearPending = useCallback(() => {
    pendingReviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingReviews([]);
  }, [pendingReviews]);

  // Upload file to storage and get public URL
  const uploadForReview = async (file: File, userId: string): Promise<string> => {
    const ext = getFileExtension(file.name);
    const fileName = `${userId}/reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Check if we need to convert the file
    let uploadBlob: Blob = file;
    let uploadExt = ext;

    // Process file for AI analysis (convert SVG/video to image)
    if (["svg", "mp4", "mov", "webm"].includes(ext)) {
      try {
        const processed = await processFileForAnalysis(file);
        uploadBlob = processed.blob;
        uploadExt = "jpg"; // Converted files become JPG
      } catch (error) {
        console.error("File conversion error:", error);
        throw new Error(`Could not process ${ext.toUpperCase()} file for analysis`);
      }
    }

    const uploadPath = `reviews/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${uploadExt}`;

    const { error: uploadError } = await supabase.storage
      .from("generation-images")
      .upload(uploadPath, uploadBlob, {
        contentType: uploadBlob.type || "image/jpeg",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload file for review");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("generation-images")
      .getPublicUrl(uploadPath);

    return urlData.publicUrl;
  };

  // Review a single file
  const reviewFile = async (
    pending: PendingReview,
    index: number,
    userId: string,
    marketplaces: string[]
  ): Promise<void> => {
    const ext = getFileExtension(pending.file.name);

    // Check for unsupported file types
    if (isUnsupportedForBrowser(pending.file.name)) {
      setPendingReviews((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                status: "error" as const,
                error: `${ext.toUpperCase()} files cannot be analyzed. Please export as PNG/JPG first.`,
              }
            : p
        )
      );
      return;
    }

    // Update status to processing
    setPendingReviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, status: "processing" as const } : p))
    );
    setProcessingCount((c) => c + 1);

    try {
      // Upload file
      const imageUrl = await uploadForReview(pending.file, userId);

      // Call edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/review-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrl,
          fileType: ext,
          fileName: pending.file.name,
          marketplaces,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Review failed: ${response.status}`);
      }

      const result: FileReviewResult = await response.json();

      // Save to database
      const { error: dbError } = await supabase.from("file_reviews").insert([
        {
          user_id: userId,
          file_name: pending.file.name,
          file_type: ext,
          image_url: imageUrl,
          overall_score: result.overallScore,
          verdict: result.verdict,
          issues: result.issues as any,
          suggestions: result.suggestions as any,
          marketplace_notes: result.marketplaceNotes as any,
        },
      ]);

      if (dbError) {
        console.error("Error saving review:", dbError);
      }

      // Deduct credit
      const { error: creditError } = await supabase.rpc("deduct_credit" as any);
      if (creditError) {
        console.warn("Could not deduct credit:", creditError);
      }

      // Update pending with result
      setPendingReviews((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, status: "completed" as const, result } : p
        )
      );
    } catch (error) {
      console.error("Review error:", error);
      setPendingReviews((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Review failed",
              }
            : p
        )
      );
    } finally {
      setProcessingCount((c) => c - 1);
    }
  };

  // Start reviewing all pending files
  const startReview = useCallback(
    async (marketplaces: string[] = ["Adobe Stock", "Freepik", "Shutterstock"]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to review files");
        return;
      }

      const pendingFiles = pendingReviews.filter((p) => p.status === "pending");
      if (pendingFiles.length === 0) {
        toast.info("No files to review");
        return;
      }

      // Check credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, has_unlimited_credits")
        .eq("id", user.id)
        .single();

      if (!profile?.has_unlimited_credits && (profile?.credits || 0) < pendingFiles.length) {
        toast.error(`Not enough credits. You need ${pendingFiles.length} credits.`);
        return;
      }

      toast.info(`Starting review of ${pendingFiles.length} file(s)...`);

      // Process files concurrently (max 3 at a time)
      const batchSize = 3;
      for (let i = 0; i < pendingReviews.length; i += batchSize) {
        const batch = pendingReviews.slice(i, i + batchSize);
        const batchPromises = batch.map((pending, batchIndex) => {
          const actualIndex = i + batchIndex;
          if (pending.status === "pending") {
            return reviewFile(pending, actualIndex, user.id, marketplaces);
          }
          return Promise.resolve();
        });
        await Promise.all(batchPromises);
      }

      toast.success("Review complete!");
      fetchHistory();
    },
    [pendingReviews, fetchHistory]
  );

  // Delete a review from history
  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase.from("file_reviews").delete().eq("id", reviewId);
      if (error) throw error;
      setReviewHistory((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  }, []);

  // Get summary statistics
  const getSummary = useCallback(() => {
    const completed = pendingReviews.filter((p) => p.status === "completed");
    return {
      total: pendingReviews.length,
      pending: pendingReviews.filter((p) => p.status === "pending").length,
      processing: processingCount,
      passed: completed.filter((p) => p.result?.verdict === "pass").length,
      warnings: completed.filter((p) => p.result?.verdict === "warning").length,
      failed: completed.filter((p) => p.result?.verdict === "fail").length,
      errors: pendingReviews.filter((p) => p.status === "error").length,
    };
  }, [pendingReviews, processingCount]);

  return {
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
  };
}
