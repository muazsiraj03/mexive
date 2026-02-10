import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Wand2, Copy, Download, X, Loader2, ThumbsUp, ThumbsDown, BookmarkPlus, Sparkles, FolderOpen, Play, StopCircle, RefreshCw, FileText, History, Search, Eye, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ToolStatsBar } from "./ToolStatsBar";
import { ToolAccessGate } from "./ToolAccessGate";
import { ReviewResultCard } from "@/components/dashboard/ReviewResultCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { processFileForAnalysis } from "@/lib/file-processor";
import { PromptStyle, DetailLevel, PromptResult, PROMPT_STYLES, DETAIL_LEVELS, downloadPromptAsText, copyToClipboard } from "@/lib/image-to-prompt";
import { usePromptTraining, PromptTrainingPreferences } from "@/hooks/use-prompt-training";
import { PromptTrainingPanel } from "./PromptTrainingPanel";
import { PromptHistoryItem } from "./PromptHistoryDrawer";
import { SingleGenTraining, SingleGenTrainingSettings, DEFAULT_SINGLE_GEN_SETTINGS } from "./SingleGenTraining";
import { ImagePromptQueue, QueuedImage } from "./ImagePromptQueue";
import { formatDistanceToNow } from "date-fns";
interface PromptVariation {
  type: "composition" | "color" | "mood";
  label: string;
  prompt: string;
}
const AI_SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
function extensionForMime(mime: string): "jpg" | "png" | "webp" | "gif" {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    default:
      return "jpg";
  }
}
async function canvasToBlob(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png", quality?: number): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error("Failed to encode image"));
      resolve(blob);
    }, type, quality);
  });
}
async function convertRasterImageToJpeg(file: File): Promise<Blob> {
  // Prefer createImageBitmap when available (faster + broader format support in modern browsers)
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(bitmap, 0, 0);
      return await canvasToBlob(canvas, "image/jpeg", 0.92);
    } finally {
      bitmap.close?.();
    }
  }

  // Fallback: HTMLImageElement path
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const canvas = document.createElement("canvas");
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = async () => {
      try {
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        resolve(blob);
      } catch (e) {
        reject(e);
      } finally {
        cleanup();
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("This image format can't be converted in your browser. Please upload PNG/JPG/WebP/GIF."));
    };
    img.src = url;
  });
}
async function prepareImageForAI(file: File): Promise<{
  blob: Blob;
  contentType: string;
  ext: string;
}> {
  // Reuse existing conversion for SVG/video/etc.
  const processed = await processFileForAnalysis(file);
  const blob = processed.blob;

  // If already in a provider-supported type, upload as-is.
  if (AI_SUPPORTED_IMAGE_TYPES.includes(blob.type as (typeof AI_SUPPORTED_IMAGE_TYPES)[number])) {
    return {
      blob,
      contentType: blob.type,
      ext: extensionForMime(blob.type)
    };
  }

  // Otherwise, try to convert to JPEG (fixes AVIF/HEIC/TIFF in browsers that can decode them)
  if (file.type.startsWith("image/")) {
    const jpeg = await convertRasterImageToJpeg(file);
    return {
      blob: jpeg,
      contentType: "image/jpeg",
      ext: "jpg"
    };
  }
  return {
    blob,
    contentType: blob.type || "application/octet-stream",
    ext: "jpg"
  };
}
export function ImageToPromptPage() {
  const {
    user,
    refreshProfile,
    isAdmin
  } = useDashboard();
  const {
    addFeedback,
    addExample,
    getTrainingContext,
    hasTrainingData,
    savePreferences,
    preferences
  } = usePromptTraining();

  // Single image mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<PromptStyle>("general");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("detailed");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [activeVariationTab, setActiveVariationTab] = useState<string>("main");
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  const [singleGenSettings, setSingleGenSettings] = useState<SingleGenTrainingSettings>(DEFAULT_SINGLE_GEN_SETTINGS);

  // Batch processing state
  const [imageQueue, setImageQueue] = useState<QueuedImage[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [shouldStopBatch, setShouldStopBatch] = useState(false);

  // Total prompts generated (from database)
  const [totalPromptsGenerated, setTotalPromptsGenerated] = useState(0);

  // Main tab state (generate vs history)
  const [mainTab, setMainTab] = useState<"generate" | "history">("generate");

  // History state
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromptHistoryItem | null>(null);

  // File input refs for folder/file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Determine active training mode for indicator
  const activeTrainingMode = singleGenSettings.enabled ? "single" : hasTrainingData ? "persistent" : "none";
  const hasCredits = isAdmin || user.hasUnlimitedCredits || user.credits >= 1;

  // Fetch total prompts count from database
  const fetchPromptsCount = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { count } = await supabase
        .from("prompt_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id);
      setTotalPromptsGenerated(count || 0);
    }
  }, []);

  // Initial fetch of prompts count
  useEffect(() => {
    fetchPromptsCount();
  }, [fetchPromptsCount]);

  // Fetch history items
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setHistoryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("prompt_history")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching history:", error);
        toast.error("Failed to load prompt history");
      } else {
        setHistoryItems(data || []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch history when tab opens
  useEffect(() => {
    if (mainTab === "history") {
      fetchHistory();
    }
  }, [mainTab, fetchHistory]);

  const toolStats = [{
    label: "Prompts Generated",
    value: totalPromptsGenerated,
    icon: FileText
  }];

  // Add files to batch queue
  const addToQueue = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("No valid image files found");
      return;
    }
    const newItems: QueuedImage[] = imageFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending"
    }));
    setImageQueue(prev => [...prev, ...newItems]);
    toast.success(`Added ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} to queue`);
  }, []);
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setFeedbackGiven(null);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);

    // If multiple files, add to batch queue
    if (files.length > 1) {
      addToQueue(files);
    } else if (files.length === 1) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, addToQueue]);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));

      // If multiple files, add to batch queue
      if (fileArray.length > 1) {
        addToQueue(fileArray);
      } else if (fileArray.length === 1) {
        handleFileSelect(fileArray[0]);
      }
    }
    // Reset input value so the same file can be selected again
    e.target.value = "";
  }, [handleFileSelect, addToQueue]);
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFolderButtonClick = useCallback(() => {
    folderInputRef.current?.click();
  }, []);
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setResult(null);
    setVariations([]);
    setActiveVariationTab("main");
    setFeedbackGiven(null);
  }, [previewUrl]);
  const handleRemoveFromQueue = useCallback((id: string) => {
    setImageQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(q => q.id !== id);
    });
  }, []);
  const handleClearQueue = useCallback(() => {
    imageQueue.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setImageQueue([]);
    setCurrentBatchIndex(0);
  }, [imageQueue]);

  // Promote single-gen settings to persistent training
  const handlePromoteToPersistent = async (settings: SingleGenTrainingSettings): Promise<boolean> => {
    const newPrefs: Partial<PromptTrainingPreferences> = {
      training_strength: settings.training_strength,
      preferred_tone: settings.preferred_tone,
      preferred_length: settings.preferred_length,
      include_keywords: [...(preferences.include_keywords || []), ...settings.include_keywords],
      exclude_keywords: [...(preferences.exclude_keywords || []), ...settings.exclude_keywords],
      custom_instructions: settings.custom_instructions ? preferences.custom_instructions ? `${preferences.custom_instructions}\n${settings.custom_instructions}` : settings.custom_instructions : preferences.custom_instructions
    };
    return await savePreferences(newPrefs);
  };
  const generatePrompt = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }
    if (!hasCredits) {
      toast.error("Insufficient credits. Please purchase more credits.");
      return;
    }
    setIsGenerating(true);
    setProgress(10);
    try {
      const prepared = await prepareImageForAI(selectedFile);

      // Upload image to get a public URL
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const safeBase = baseName.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const fileName = `prompt-gen/${Date.now()}-${safeBase}.${prepared.ext}`;
      setProgress(30);
      const {
        error: uploadError
      } = await supabase.storage.from("generation-images").upload(fileName, prepared.blob, {
        contentType: prepared.contentType
      });
      if (uploadError) {
        throw new Error("Failed to upload image");
      }
      const {
        data: urlData
      } = supabase.storage.from("generation-images").getPublicUrl(fileName);

      // Store the public URL for reuse in variations
      setUploadedImageUrl(urlData.publicUrl);
      setProgress(50);

      // Get training context for personalized generation
      let trainingContext = hasTrainingData ? getTrainingContext() : null;

      // If single-gen settings are enabled, merge or override
      if (singleGenSettings.enabled) {
        const singleGenContext = {
          trainingStrength: singleGenSettings.training_strength / 100,
          preferences: {
            tone: singleGenSettings.preferred_tone,
            length: singleGenSettings.preferred_length,
            includeKeywords: singleGenSettings.include_keywords,
            excludeKeywords: singleGenSettings.exclude_keywords,
            customInstructions: singleGenSettings.custom_instructions || null
          },
          // Keep examples and feedback from persistent training if available
          positiveExamples: trainingContext?.positiveExamples || [],
          negativeExamples: trainingContext?.negativeExamples || [],
          likedPrompts: trainingContext?.likedPrompts || [],
          dislikedPrompts: trainingContext?.dislikedPrompts || []
        };
        trainingContext = singleGenContext;
      }

      // Call the edge function
      const {
        data,
        error
      } = await supabase.functions.invoke("image-to-prompt", {
        body: {
          imageUrl: urlData.publicUrl,
          style,
          detailLevel,
          trainingContext
        }
      });
      setProgress(80);
      if (error) throw error;
      if (data.error) {
        throw new Error(data.error);
      }
      const promptResult = data as PromptResult;
      setResult(promptResult);
      setFeedbackGiven(null);

      // Save to history
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("prompt_history").insert([{
          user_id: user.id,
          image_url: urlData.publicUrl,
          prompt: promptResult.prompt,
          negative_prompt: promptResult.negativePrompt || null,
          style,
          detail_level: detailLevel,
          art_style: promptResult.artStyle || null,
          dominant_colors: promptResult.dominantColors || [],
          aspect_ratio: promptResult.suggestedAspectRatio || null,
          training_snapshot: trainingContext
        }]);
      }

      // Refresh profile to get updated credits and prompts count
      await refreshProfile();
      await fetchPromptsCount();
      setProgress(100);
      toast.success("Prompt generated successfully!");

      // Don't clean up the image - it's needed for history
      // The cleanup-old-generations function will handle this
    } catch (error) {
      console.error("Generation error:", error);
      const anyErr = error as any;
      const status = anyErr?.context?.status as number | undefined;
      if (status === 400) {
        toast.error("Unsupported image format. Please upload PNG, JPEG, WebP, or GIF.");
        return;
      }
      if (status === 429 || anyErr?.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (status === 402 || anyErr?.message?.includes("402")) {
        toast.error("AI credits exhausted. Please add more credits.");
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to generate prompt";
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Generate 3 prompt variations (composition, color, mood focused)
  const generateVariations = async () => {
    if (!result || !uploadedImageUrl) {
      toast.error("Generate a main prompt first");
      return;
    }
    if (!hasCredits) {
      toast.error("Insufficient credits. Please purchase more credits.");
      return;
    }
    setIsGeneratingVariations(true);
    try {
      // Generate all 3 variations with modified prompts
      const variationTypes = [{
        type: "composition" as const,
        label: "Composition",
        instruction: "Focus heavily on composition, framing, perspective, and spatial arrangement. Emphasize camera angles, rule of thirds, leading lines, and visual hierarchy."
      }, {
        type: "color" as const,
        label: "Color",
        instruction: "Focus heavily on color palette, color harmony, saturation, contrast, and color temperature. Emphasize specific color names, gradients, and color relationships."
      }, {
        type: "mood" as const,
        label: "Mood",
        instruction: "Focus heavily on mood, atmosphere, emotion, and feeling. Emphasize lighting quality, time of day, weather, ambiance, and emotional impact."
      }];
      const variationPromises = variationTypes.map(async vt => {
        // Build context with variation focus
        let trainingContext = hasTrainingData ? getTrainingContext() : null;
        if (singleGenSettings.enabled) {
          trainingContext = {
            trainingStrength: singleGenSettings.training_strength / 100,
            preferences: {
              tone: singleGenSettings.preferred_tone,
              length: singleGenSettings.preferred_length,
              includeKeywords: singleGenSettings.include_keywords,
              excludeKeywords: singleGenSettings.exclude_keywords,
              customInstructions: `${vt.instruction}${singleGenSettings.custom_instructions ? ` ${singleGenSettings.custom_instructions}` : ""}`
            },
            positiveExamples: trainingContext?.positiveExamples || [],
            negativeExamples: trainingContext?.negativeExamples || [],
            likedPrompts: trainingContext?.likedPrompts || [],
            dislikedPrompts: trainingContext?.dislikedPrompts || []
          };
        } else if (trainingContext) {
          trainingContext = {
            ...trainingContext,
            preferences: {
              ...trainingContext.preferences,
              customInstructions: `${vt.instruction}${trainingContext.preferences?.customInstructions ? ` ${trainingContext.preferences.customInstructions}` : ""}`
            }
          };
        } else {
          trainingContext = {
            trainingStrength: 0.75,
            preferences: {
              tone: "neutral",
              length: "medium",
              includeKeywords: [] as string[],
              excludeKeywords: [] as string[],
              customInstructions: vt.instruction
            },
            positiveExamples: [],
            negativeExamples: [],
            likedPrompts: [],
            dislikedPrompts: []
          };
        }
        const {
          data,
          error
        } = await supabase.functions.invoke("image-to-prompt", {
          body: {
            imageUrl: uploadedImageUrl,
            // Use stored public URL instead of blob URL
            style,
            detailLevel,
            trainingContext
          }
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        return {
          type: vt.type,
          label: vt.label,
          prompt: data.prompt
        };
      });
      const results = await Promise.all(variationPromises);
      setVariations(results);
      setActiveVariationTab("composition");
      await refreshProfile();
      toast.success("Generated 3 prompt variations!");
    } catch (error) {
      console.error("Variations error:", error);
      toast.error("Failed to generate variations. Please try again.");
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // Process a single image for batch processing (reusable logic)
  const processImageForPrompt = async (file: File): Promise<{
    result: PromptResult;
    uploadedUrl: string;
  }> => {
    const prepared = await prepareImageForAI(file);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const safeBase = baseName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const fileName = `prompt-gen/${Date.now()}-${safeBase}.${prepared.ext}`;
    const {
      error: uploadError
    } = await supabase.storage.from("generation-images").upload(fileName, prepared.blob, {
      contentType: prepared.contentType
    });
    if (uploadError) {
      throw new Error("Failed to upload image");
    }
    const {
      data: urlData
    } = supabase.storage.from("generation-images").getPublicUrl(fileName);
    let trainingContext = hasTrainingData ? getTrainingContext() : null;
    if (singleGenSettings.enabled) {
      trainingContext = {
        trainingStrength: singleGenSettings.training_strength / 100,
        preferences: {
          tone: singleGenSettings.preferred_tone,
          length: singleGenSettings.preferred_length,
          includeKeywords: singleGenSettings.include_keywords,
          excludeKeywords: singleGenSettings.exclude_keywords,
          customInstructions: singleGenSettings.custom_instructions || null
        },
        positiveExamples: trainingContext?.positiveExamples || [],
        negativeExamples: trainingContext?.negativeExamples || [],
        likedPrompts: trainingContext?.likedPrompts || [],
        dislikedPrompts: trainingContext?.dislikedPrompts || []
      };
    }
    const {
      data,
      error
    } = await supabase.functions.invoke("image-to-prompt", {
      body: {
        imageUrl: urlData.publicUrl,
        style,
        detailLevel,
        trainingContext
      }
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    const promptResult = data as PromptResult;

    // Save to history
    const {
      data: {
        user: authUser
      }
    } = await supabase.auth.getUser();
    if (authUser) {
      await supabase.from("prompt_history").insert([{
        user_id: authUser.id,
        image_url: urlData.publicUrl,
        prompt: promptResult.prompt,
        negative_prompt: promptResult.negativePrompt || null,
        style,
        detail_level: detailLevel,
        art_style: promptResult.artStyle || null,
        dominant_colors: promptResult.dominantColors || [],
        aspect_ratio: promptResult.suggestedAspectRatio || null,
        training_snapshot: trainingContext
      }]);
    }
    return {
      result: promptResult,
      uploadedUrl: urlData.publicUrl
    };
  };

  // Helper to delay between batch requests to avoid rate limits
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Batch processing function
  const processBatch = async () => {
    if (imageQueue.length === 0) {
      toast.error("No images in queue");
      return;
    }
    const pendingItems = imageQueue.filter(q => q.status === "pending");
    if (pendingItems.length === 0) {
      toast.error("No pending images to process");
      return;
    }
    const creditsNeeded = pendingItems.length;
    if (!isAdmin && !user.hasUnlimitedCredits && user.credits < creditsNeeded) {
      toast.error(`Not enough credits. Need ${creditsNeeded}, have ${user.credits}`);
      return;
    }
    setIsBatchProcessing(true);
    setShouldStopBatch(false);
    let processedCount = 0;
    let isFirstRequest = true;
    for (let i = 0; i < imageQueue.length; i++) {
      const item = imageQueue[i];
      if (item.status !== "pending") continue;
      if (shouldStopBatch) break;

      // Add delay between requests to avoid rate limiting (skip first request)
      if (!isFirstRequest) {
        await delay(2000); // 2 second delay between requests
      }
      isFirstRequest = false;
      setCurrentBatchIndex(i);

      // Update status to processing
      setImageQueue(prev => prev.map(q => q.id === item.id ? {
        ...q,
        status: "processing" as const
      } : q));
      try {
        const {
          result,
          uploadedUrl
        } = await processImageForPrompt(item.file);

        // Update with result
        setImageQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "completed" as const,
          result,
          uploadedImageUrl: uploadedUrl
        } : q));
        processedCount++;
        await refreshProfile();
      } catch (error) {
        console.error("Batch item error:", error);
        const anyErr = error as any;
        let message = error instanceof Error ? error.message : "Failed to generate prompt";

        // If rate limited, add extra delay before next request
        if (anyErr?.message?.includes("429") || anyErr?.message?.includes("Rate limit")) {
          message = "Rate limited - will retry with slower pace";
          await delay(5000); // Extra 5 second delay on rate limit
        }
        setImageQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "error" as const,
          error: message
        } : q));
      }
    }
    setIsBatchProcessing(false);
    setCurrentBatchIndex(0);
    if (processedCount > 0) {
      await fetchPromptsCount();
      toast.success(`Processed ${processedCount} image${processedCount > 1 ? "s" : ""}!`);
    }
  };
  const stopBatch = useCallback(() => {
    setShouldStopBatch(true);
    toast.info("Stopping after current image...");
  }, []);

  // Retry a single failed item
  const handleRetryItem = useCallback((id: string) => {
    setImageQueue(prev => prev.map(q => q.id === id ? {
      ...q,
      status: "pending" as const,
      error: undefined
    } : q));
  }, []);

  // Retry all failed items
  const handleRetryAllFailed = useCallback(() => {
    setImageQueue(prev => prev.map(q => q.status === "error" ? {
      ...q,
      status: "pending" as const,
      error: undefined
    } : q));
    toast.success("Reset failed items - ready to process again");
  }, []);
  const handleCopy = async () => {
    if (!result) return;
    const success = await copyToClipboard(result.prompt);
    if (success) {
      toast.success("Prompt copied to clipboard!");
    } else {
      toast.error("Failed to copy prompt");
    }
  };
  const handleDownload = () => {
    if (!result) return;
    const filename = `prompt-${style}-${detailLevel}-${Date.now()}.txt`;
    let content = result.prompt;
    if (result.negativePrompt) {
      content += `\n\n--- Negative Prompt ---\n${result.negativePrompt}`;
    }
    downloadPromptAsText(content, filename);
    toast.success("Prompt downloaded!");
  };
  const handleFeedback = async (rating: 1 | -1) => {
    if (!result) return;
    const success = await addFeedback({
      prompt_text: result.prompt,
      style,
      detail_level: detailLevel,
      rating
    });
    if (success) {
      setFeedbackGiven(rating === 1 ? "up" : "down");
    }
  };
  const handleSaveAsExample = async (isPositive: boolean) => {
    if (!result) return;
    await addExample({
      prompt_text: result.prompt,
      style,
      is_positive: isPositive,
      image_url: uploadedImageUrl || undefined
    });
  };

  // Handle regenerate from history
  const handleRegenerateFromHistory = useCallback(async (historyItem: PromptHistoryItem) => {
    // Set the style and detail level from the history item
    setStyle(historyItem.style as PromptStyle);
    setDetailLevel(historyItem.detail_level as DetailLevel);

    // Fetch the image from history and set it for regeneration
    try {
      const response = await fetch(historyItem.image_url);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const file = new File([blob], `regenerate-${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg"
      });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedImageUrl(historyItem.image_url);
      setResult(null);
      setFeedbackGiven(null);
      toast.success("Image loaded for regeneration. Click 'Generate Prompt' to create a new prompt.");
    } catch (error) {
      console.error("Failed to load image for regeneration:", error);
      toast.error("Failed to load image for regeneration");
    }
  }, []);
  return <ToolAccessGate toolId="image-to-prompt">
      <DashboardHeader title="Image to Prompt" description="Analyze images and generate AI prompts for Midjourney, DALL-E, and Stable Diffusion" />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-7xl space-y-6">
        {/* Stats Bar */}
        <AnimatedSection variant="fade-up">
          <ToolStatsBar stats={toolStats} />
        </AnimatedSection>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DashboardBreadcrumb />
            {/* Training Mode Indicator */}
            {activeTrainingMode !== "none" && <Badge variant={activeTrainingMode === "single" ? "default" : "secondary"} className={cn("text-xs", activeTrainingMode === "single" && "bg-secondary hover:bg-secondary/90 text-secondary-foreground")}>
                {activeTrainingMode === "single" ? "⚡ This Gen Active" : "🔄 Always Training"}
              </Badge>}
          </div>
          <div className="flex items-center gap-2">
            <SingleGenTraining settings={singleGenSettings} onChange={setSingleGenSettings} onPromoteToPersistent={handlePromoteToPersistent} />
            <PromptTrainingPanel />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "generate" | "history")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
              {totalPromptsGenerated > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {totalPromptsGenerated}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="mt-6 space-y-6">
        {!previewUrl && imageQueue.length === 0 && <AnimatedSection variant="fade-up">
            <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
              <h2 className="text-lg font-semibold text-foreground">Upload Images</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a single image or multiple images for batch processing. Supports JPG, PNG, WebP.
              </p>
              
              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleInputChange} className="hidden" />
              <input ref={folderInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" {...{
              webkitdirectory: "",
              directory: ""
            } as React.InputHTMLAttributes<HTMLInputElement>} />

              {/* Upload Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleFileButtonClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleFolderButtonClick}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Upload Folder
                </Button>
              </div>

              {/* Drop Zone */}
              <div className="mt-4">
                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={cn("border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer", isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50")} onClick={handleFileButtonClick}>
                  <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
                  <p className="text-lg font-medium text-foreground mb-1">
                    Or drag and drop here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drop multiple images for batch processing
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>}

        {/* Batch Queue Section */}
        {imageQueue.length > 0 && <AnimatedSection variant="fade-up">
            <div className="space-y-4">
              {/* Batch Controls */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Batch Processing</h2>
                  <Badge variant="secondary">
                    {imageQueue.filter(q => q.status === "pending").length} pending
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isBatchProcessing ? <>
                      <Button variant="outline" size="sm" onClick={handleFileButtonClick}>
                        <Upload className="h-4 w-4 mr-1.5" />
                        Add More
                      </Button>
                      <Button onClick={processBatch} disabled={imageQueue.filter(q => q.status === "pending").length === 0 || !hasCredits} size="sm">
                        <Play className="h-4 w-4 mr-1.5" />
                        Process All ({imageQueue.filter(q => q.status === "pending").length} credits)
                      </Button>
                    </> : <Button variant="destructive" size="sm" onClick={stopBatch}>
                      <StopCircle className="h-4 w-4 mr-1.5" />
                      Stop
                    </Button>}
                </div>
              </div>

              {/* Hidden file inputs for adding more */}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleInputChange} className="hidden" />
              <input ref={folderInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" {...{
              webkitdirectory: "",
              directory: ""
            } as React.InputHTMLAttributes<HTMLInputElement>} />

              {/* Queue Component */}
              <ImagePromptQueue queue={imageQueue} currentIndex={currentBatchIndex} isProcessing={isBatchProcessing} onRemove={handleRemoveFromQueue} onClear={handleClearQueue} onRetry={handleRetryItem} onRetryAllFailed={handleRetryAllFailed} />
            </div>
          </AnimatedSection>}

        {/* Preview Section - shown when image is loaded */}
        {previewUrl && <div className="space-y-6">
            {/* Image and Result Grid */}
            <AnimatedSection variant="fade-up">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Image Preview</h3>
                    <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </AspectRatio>
                </div>

                {/* Generated Prompt */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Generated Prompt</h3>
                    {result && <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", feedbackGiven === "up" && "bg-green-500/20 text-green-600")} onClick={() => handleFeedback(1)} disabled={feedbackGiven !== null} title="Good prompt">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", feedbackGiven === "down" && "bg-red-500/20 text-red-600")} onClick={() => handleFeedback(-1)} disabled={feedbackGiven !== null} title="Bad prompt">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveAsExample(true)} title="Save as example">
                          <BookmarkPlus className="h-4 w-4" />
                        </Button>
                      </div>}
                  </div>
                  <div className="rounded-lg overflow-hidden bg-muted min-h-[200px] max-h-[400px] overflow-y-auto">
                    {result ? <Tabs value={activeVariationTab} onValueChange={setActiveVariationTab} className="w-full">
                        {variations.length > 0 && <div className="border-b border-border bg-background/50 sticky top-0 z-10">
                            <TabsList className="w-full justify-start h-auto p-1 bg-transparent">
                              <TabsTrigger value="main" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Main
                              </TabsTrigger>
                              {variations.map(v => <TabsTrigger key={v.type} value={v.type} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                  {v.label}
                                </TabsTrigger>)}
                            </TabsList>
                          </div>}
                        <TabsContent value="main" className="m-0">
                          <div className="p-4 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground flex-1">
                                {result.prompt}
                              </p>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy} title="Copy prompt">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {result.negativePrompt && <div className="pt-3 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Negative Prompt</p>
                                <p className="text-sm text-destructive/80">
                                  {result.negativePrompt}
                                </p>
                              </div>}
                          </div>
                        </TabsContent>
                        {variations.map(v => <TabsContent key={v.type} value={v.type} className="m-0">
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <Badge variant="outline" className="text-xs">
                                  {v.label} Focus
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                            const success = await copyToClipboard(v.prompt);
                            if (success) {
                              toast.success(`${v.label} prompt copied!`);
                            } else {
                              toast.error("Failed to copy");
                            }
                          }} title={`Copy ${v.label} prompt`}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                {v.prompt}
                              </p>
                            </div>
                          </TabsContent>)}
                      </Tabs> : <div className="w-full h-full min-h-[200px] flex items-center justify-center text-muted-foreground">
                        {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : <div className="text-center">
                            <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Result will appear here</p>
                          </div>}
                      </div>}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Configuration */}
            <AnimatedSection variant="fade-up" delay={100}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h3 className="text-base font-semibold text-foreground mb-4">Configuration</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Prompt Style */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Prompt Style</label>
                    <Select value={style} onValueChange={v => setStyle(v as PromptStyle)}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        {PROMPT_STYLES.map(s => <SelectItem key={s.value} value={s.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{s.label}</span>
                              <span className="text-xs text-muted-foreground">{s.description}</span>
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Detail Level */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Detail Level</label>
                    <Select value={detailLevel} onValueChange={v => setDetailLevel(v as DetailLevel)}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select detail level" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        {DETAIL_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{d.label}</span>
                              <span className="text-xs text-muted-foreground">{d.description}</span>
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Progress Bar */}
            {isGenerating && <AnimatedSection variant="fade-up" delay={150}>
                <Card className="rounded-2xl border-border/60 card-elevated">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Analyzing image...</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>}

            {/* Action Buttons */}
            <AnimatedSection variant="fade-up" delay={200}>
              <div className="flex flex-wrap gap-3">
                {!result ? <Button onClick={generatePrompt} disabled={!selectedFile || isGenerating || !hasCredits} size="lg" className="rounded-full">
                    {isGenerating ? <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </> : <>
                        <Wand2 className="h-4 w-4" />
                        Generate Prompt (1 Credit)
                      </>}
                  </Button> : <>
                    <Button onClick={handleCopy} size="lg" className="rounded-full">
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </Button>
                    <Button onClick={handleDownload} variant="secondary" size="lg" className="rounded-full">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button onClick={generateVariations} variant="secondary" size="lg" className="rounded-full" disabled={isGeneratingVariations || !hasCredits}>
                      {isGeneratingVariations ? <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </> : <>
                          <Sparkles className="h-4 w-4" />
                          Variations (3 Credits)
                        </>}
                    </Button>
                    <Button onClick={generatePrompt} variant="outline" size="lg" className="rounded-full" disabled={isGenerating || !hasCredits}>
                      <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                      Regenerate
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="lg" className="rounded-full">
                      <Upload className="h-4 w-4" />
                      New Image
                    </Button>
                  </>}
              </div>

              {/* Credits Info */}
              <p className="text-xs text-muted-foreground mt-4">
                {isAdmin || user.hasUnlimitedCredits ? "💡 You have unlimited credits" : `💡 You have ${user.credits} credits remaining`}
              </p>
            </AnimatedSection>
          </div>}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <AnimatedSection variant="fade-up">
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h2 className="text-lg font-semibold text-foreground">Prompt History</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and reuse your previously generated prompts
                </p>

                {/* Search */}
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search prompts..."
                    className="pl-9"
                  />
                </div>

                {/* History Items */}
                <ScrollArea className="h-[calc(100vh-300px)] mt-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No prompt history yet
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {historyItems
                        .filter((item) =>
                          item.prompt.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.style.toLowerCase().includes(historySearch.toLowerCase())
                        )
                        .map((item) => (
                          <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                            {/* Image and Prompt */}
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
                                  onClick={() => copyToClipboard(item.prompt)}
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
                                  className="h-7 w-7"
                                  onClick={() => handleRegenerateFromHistory(item)}
                                  title="Regenerate"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from("prompt_history")
                                      .delete()
                                      .eq("id", item.id);
                                    if (error) {
                                      toast.error("Failed to delete");
                                    } else {
                                      setHistoryItems((prev) => prev.filter((i) => i.id !== item.id));
                                      toast.success("Deleted from history");
                                    }
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </ToolAccessGate>;
}