import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default rejection reasons (used if no config in database)
const DEFAULT_REJECTION_CATALOG = {
  raster: {
    VISUALLY_POOR: { message: "Image is visually unappealing", severity: "high", category: "visual_quality", enabled: true },
    NOT_REALISTIC: { message: "Image does not look realistic", severity: "high", category: "visual_quality", enabled: true },
    HUMAN_ANATOMY_ISSUES: { message: "Human anatomy issues detected (hands, feet, face)", severity: "high", category: "content", enabled: true },
    IMAGE_QUALITY_POOR: { message: "Poor image quality (noise, pixels, broken details)", severity: "high", category: "technical", enabled: true },
    BLUR_DETECTED: { message: "Image appears blurry or out of focus", severity: "high", category: "technical", enabled: true },
    LOW_RESOLUTION: { message: "Resolution is below 4MP", severity: "medium", category: "technical", enabled: true },
    WATERMARK_DETECTED: { message: "Logo or watermark detected", severity: "high", category: "content", enabled: true },
    SUBJECT_ISSUES: { message: "Subject is damaged, half-cut, or unclear", severity: "high", category: "content", enabled: true },
    OVER_EDITED: { message: "Image is over-edited or over-detailed", severity: "medium", category: "visual_quality", enabled: true },
    NOT_STOCK_USABLE: { message: "Not suitable for stock usage", severity: "high", category: "commercial", enabled: true },
  },
  svg: {
    SHAPE_BROKEN: { message: "Shapes are broken or distorted", severity: "high", category: "technical", enabled: true },
    MESSY_PATHS: { message: "Anchor points or paths are messy", severity: "medium", category: "technical", enabled: true },
    UNNECESSARY_DETAIL: { message: "Too many unnecessary details", severity: "low", category: "visual_quality", enabled: true },
    INCONSISTENT_STROKES: { message: "Stroke or fill is inconsistent", severity: "medium", category: "technical", enabled: true },
    ZOOM_QUALITY_POOR: { message: "Design is not clean when zoomed", severity: "medium", category: "technical", enabled: true },
    TEXT_NOT_OUTLINED: { message: "Text is not converted to outlines", severity: "high", category: "technical", enabled: true },
    ICON_NOT_CLEAR: { message: "Icon or illustration is unclear", severity: "medium", category: "visual_quality", enabled: true },
    NOT_COMMERCIAL_FRIENDLY: { message: "Not suitable for commercial use", severity: "high", category: "commercial", enabled: true },
  },
  eps: {
    FILE_ERROR: { message: "File opens with errors", severity: "high", category: "technical", enabled: true },
    CLIPPED_ARTWORK: { message: "Artwork is clipped or broken", severity: "high", category: "technical", enabled: true },
    EXCESSIVE_ANCHORS: { message: "Too many anchor points", severity: "medium", category: "technical", enabled: true },
    STROKE_NOT_EXPANDED: { message: "Strokes are not expanded", severity: "medium", category: "technical", enabled: true },
    RASTER_EMBEDDED: { message: "Raster elements are embedded", severity: "high", category: "technical", enabled: true },
    HIDDEN_OBJECTS: { message: "Unnecessary hidden objects detected", severity: "low", category: "technical", enabled: true },
    OVER_COMPLEX: { message: "Design is overly complex", severity: "medium", category: "visual_quality", enabled: true },
    NOT_PRINT_READY: { message: "Not clean or print-ready", severity: "high", category: "commercial", enabled: true },
  },
  ai: {
    FILE_CORRUPTED: { message: "File is corrupted or won't open", severity: "high", category: "technical", enabled: true },
    LINKED_IMAGE_MISSING: { message: "Linked images are missing", severity: "high", category: "technical", enabled: true },
    HIDDEN_LAYERS: { message: "Hidden layers or junk objects present", severity: "low", category: "technical", enabled: true },
    TEXT_NOT_OUTLINED: { message: "Text is not outlined", severity: "high", category: "technical", enabled: true },
    ARTBOARD_MESSY: { message: "Artboard is messy", severity: "medium", category: "technical", enabled: true },
    UNNECESSARY_EFFECTS: { message: "Unnecessary effects applied", severity: "low", category: "visual_quality", enabled: true },
    NOT_CLEAN_VECTOR: { message: "Not a clean vector", severity: "medium", category: "technical", enabled: true },
    NOT_STOCK_USABLE: { message: "Not suitable for stock usage", severity: "high", category: "commercial", enabled: true },
  },
  video: {
    VIDEO_QUALITY_POOR: { message: "Video quality is poor", severity: "high", category: "technical", enabled: true },
    SHAKY_FOOTAGE: { message: "Footage is shaky or unstable", severity: "high", category: "technical", enabled: true },
    BLUR_NOISE: { message: "Too much blur or noise", severity: "medium", category: "technical", enabled: true },
    INCONSISTENT_LIGHTING: { message: "Lighting is inconsistent", severity: "medium", category: "visual_quality", enabled: true },
    SUBJECT_NOT_CLEAR: { message: "Subject is not clear", severity: "high", category: "content", enabled: true },
    UNREALISTIC_MOTION: { message: "Motion appears unrealistic or fake", severity: "high", category: "visual_quality", enabled: true },
    WATERMARK_DETECTED: { message: "Logo or watermark detected", severity: "high", category: "content", enabled: true },
    NOT_STOCK_USABLE: { message: "Not suitable for stock use", severity: "high", category: "commercial", enabled: true },
  },
};

interface FileReviewerConfig {
  rejection_reasons: Record<string, Record<string, { message: string; severity: string; category: string; enabled: boolean }>>;
  marketplace_rules: Record<string, { min_resolution: number; min_dimension: number; allowed_formats: string[]; notes: string }>;
  scoring_weights: { visual_quality: number; technical: number; content: number; commercial: number };
  pass_threshold: number;
  warning_threshold: number;
}

interface UserCredits {
  hasCredits: boolean;
  isUnlimited: boolean;
  isAdmin: boolean;
  userId: string;
  currentCredits: number;
}

/**
 * Verify user has credits and return user info
 */
async function verifyUserCredits(authHeader: string | null): Promise<UserCredits> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  if (!authHeader) {
    throw new Error("Authorization header required");
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Authentication required");
  }
  
  // Check if user is admin
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  
  const isAdmin = !!roleData;
  
  // Get user subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("credits_remaining, plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  
  if (subError) {
    console.error("Error fetching subscription:", subError);
    throw new Error("Could not verify subscription");
  }
  
  // Check for unlimited plan
  const { data: planConfig } = await supabase
    .from("pricing_config")
    .select("is_unlimited")
    .eq("plan_name", subscription?.plan || "free")
    .maybeSingle();
  
  const isUnlimited = planConfig?.is_unlimited || false;
  const currentCredits = subscription?.credits_remaining || 0;
  const hasCredits = isAdmin || isUnlimited || currentCredits >= 1;
  
  return {
    hasCredits,
    isUnlimited,
    isAdmin,
    userId: user.id,
    currentCredits
  };
}

/**
 * Deduct 1 credit from user's subscription
 */
async function deductCredit(userId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get current credits and decrement
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("credits_remaining")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  
  if (sub) {
    await supabase
      .from("subscriptions")
      .update({ 
        credits_remaining: Math.max(0, sub.credits_remaining - 1),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("status", "active");
    
    console.log(`Deducted 1 credit from user ${userId}. Remaining: ${sub.credits_remaining - 1}`);
  }
}

async function loadConfig(): Promise<FileReviewerConfig | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not available, using defaults");
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("file_reviewer_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error) {
      console.warn("Could not load config from database:", error.message);
      return null;
    }

    console.log("Loaded config from database");
    return data as FileReviewerConfig;
  } catch (error) {
    console.warn("Error loading config:", error);
    return null;
  }
}

function getFileCategory(fileType: string): string {
  const type = fileType.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "tiff"].includes(type)) return "raster";
  if (["svg"].includes(type)) return "svg";
  if (["eps"].includes(type)) return "eps";
  if (["ai"].includes(type)) return "ai";
  if (["mp4", "mov", "webm", "avi", "wmv"].includes(type)) return "video";
  return "raster";
}

function buildSystemPrompt(
  fileType: string,
  marketplaces: string[],
  config: FileReviewerConfig | null
): string {
  const category = getFileCategory(fileType);
  const rejectionReasons = config?.rejection_reasons || DEFAULT_REJECTION_CATALOG;
  const relevantCatalog = (rejectionReasons as Record<string, Record<string, { message: string; severity: string; category: string; enabled: boolean }>>)[category] || {};
  
  const enabledReasons = Object.entries(relevantCatalog)
    .filter(([_, info]: [string, { message: string; severity: string; category: string; enabled: boolean }]) => info.enabled !== false)
    .map(([code, info]: [string, { message: string; severity: string; category: string; enabled: boolean }]) => `- ${code}: ${info.message}`)
    .join("\n");

  const marketplaceRulesText = config?.marketplace_rules
    ? marketplaces.map((mp) => {
        const rule = config.marketplace_rules[mp];
        if (rule) {
          return `${mp}: Min ${rule.min_resolution / 1000000}MP, min dimension ${rule.min_dimension}px. ${rule.notes}`;
        }
        return "";
      }).filter(Boolean).join("\n")
    : "";

  const weights = config?.scoring_weights || { visual_quality: 25, technical: 30, content: 25, commercial: 20 };
  const passThreshold = config?.pass_threshold || 70;
  const warningThreshold = config?.warning_threshold || 50;

  return `You are an expert stock marketplace file reviewer. Your job is to analyze files for potential rejection reasons before submission to stock marketplaces like ${marketplaces.join(", ")}.

FILE TYPE: ${fileType.toUpperCase()} (${category} file)

REJECTION REASONS TO CHECK FOR:
${enabledReasons}

${marketplaceRulesText ? `MARKETPLACE REQUIREMENTS:\n${marketplaceRulesText}\n` : ""}

SCORING WEIGHTS (use these to calculate overall score):
- Visual Quality: ${weights.visual_quality}%
- Technical: ${weights.technical}%
- Content: ${weights.content}%
- Commercial Viability: ${weights.commercial}%

ANALYSIS INSTRUCTIONS:
1. Carefully examine the image/frame for ALL potential issues listed above
2. Be thorough but fair - only flag genuine issues that would cause rejection
3. Consider marketplace-specific requirements for: ${marketplaces.join(", ")}
4. Provide actionable suggestions for improvement

RESPONSE FORMAT (JSON):
{
  "overallScore": <0-100 quality score>,
  "verdict": "<pass|warning|fail>",
  "issues": [
    {
      "code": "<ISSUE_CODE from list above>",
      "severity": "<high|medium|low>",
      "category": "<category>",
      "message": "<English message>",
      "details": "<specific details about this issue in the file>"
    }
  ],
  "suggestions": [
    "<actionable improvement suggestion 1>",
    "<actionable improvement suggestion 2>"
  ],
  "marketplaceNotes": {
    "${marketplaces[0] || "Adobe Stock"}": "<specific note for this marketplace>",
    "${marketplaces[1] || "Freepik"}": "<specific note for this marketplace>",
    "${marketplaces[2] || "Shutterstock"}": "<specific note for this marketplace>"
  }
}

SCORING GUIDE:
- 90-100: Excellent, likely to be accepted on all marketplaces
- 70-89: Good, may need minor improvements
- 50-69: Fair, needs attention on some issues
- 30-49: Poor, significant issues need fixing
- 0-29: Very poor, major rework needed

VERDICT GUIDE:
- pass: Score >= ${passThreshold} and no high-severity issues
- warning: Score ${warningThreshold}-${passThreshold - 1} OR has medium-severity issues
- fail: Score < ${warningThreshold} OR has any high-severity issues

Be specific in your details field - mention exactly what you see that causes the issue.`;
}

async function callAIWithRetry(
  imageUrl: string,
  systemPrompt: string,
  apiKey: string,
  maxRetries = 2
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI analysis attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this file for stock marketplace submission. Check for all potential rejection reasons and provide a detailed review.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI Gateway error (${response.status}):`, errorText);

        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }

        if (response.status >= 500 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("AI response error:", data.error);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(data.error.message || "AI analysis returned an error");
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response as JSON");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("AI analysis failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user has credits
    const authHeader = req.headers.get("Authorization");
    let userCredits: UserCredits;
    
    try {
      userCredits = await verifyUserCredits(authHeader);
    } catch (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError instanceof Error ? authError.message : "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!userCredits.hasCredits) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits. Please purchase more credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageUrl, fileType, fileName, marketplaces = ["Adobe Stock", "Freepik", "Shutterstock"] } = await req.json();

    if (!imageUrl || !fileType || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageUrl, fileType, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Reviewing file: ${fileName} (${fileType})`);
    console.log("User:", userCredits.userId, "Credits:", userCredits.currentCredits);

    // Load config from database
    const config = await loadConfig();

    // Get API key
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the analysis prompt with config
    const systemPrompt = buildSystemPrompt(fileType, marketplaces, config);

    // Call AI for analysis
    const analysis = await callAIWithRetry(imageUrl, systemPrompt, apiKey);

    console.log(`Analysis complete: ${analysis.verdict} (score: ${analysis.overallScore})`);

    // Deduct credit after successful analysis (skip for admin/unlimited)
    if (!userCredits.isAdmin && !userCredits.isUnlimited) {
      try {
        await deductCredit(userCredits.userId);
      } catch (creditError) {
        console.error("Failed to deduct credit:", creditError);
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Review file error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const status = errorMessage.includes("Rate limit") ? 429 : 
                   errorMessage.includes("credits exhausted") ? 402 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
