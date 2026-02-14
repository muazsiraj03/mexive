import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKETPLACE_GUIDELINES: Record<string, { titleStyle: string; keywordFocus: string; descriptionStyle: string }> = {
  "Adobe Stock": {
    titleStyle: "Professional, editorial-style. Focus on clarity and licensing appeal.",
    keywordFocus: "Premium, licensing-friendly terms. Include technical photography terms, professional contexts, and editorial concepts.",
    descriptionStyle: "Professional, licensing-focused. Describe the image content, mood, and potential commercial uses. Include subject details, atmosphere, and business applications."
  },
  "Shutterstock": {
    titleStyle: "SEO-optimized, highly descriptive. Front-load important keywords.",
    keywordFocus: "High-volume search terms. Include popular variations, trending topics, and broad commercial appeal terms.",
    descriptionStyle: "SEO-rich description. Focus on searchable content, visual elements, and diverse use cases. Include style, mood, and context."
  },
  "Freepik": {
    titleStyle: "Creative, resource-focused. Emphasize design utility and versatility.",
    keywordFocus: "Design and graphic terms. Include resource types, design styles, and creative application contexts.",
    descriptionStyle: "Design-focused description. Highlight graphic design applications, versatility, and creative possibilities. Mention suitable projects and formats."
  }
};

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

/**
 * Helper to delay execution (for retry logic)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call AI with retry logic for transient errors
 */
async function callAIWithRetry(
  apiKey: string,
  body: object,
  maxRetries = 2
): Promise<{ success: true; data: unknown } | { success: false; error: string; status: number }> {
  let lastError = "Unknown error";
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`Retry attempt ${attempt}/${maxRetries}...`);
      await delay(1000 * attempt);
    }
    
    try {
      const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI gateway HTTP error (attempt ${attempt}):`, response.status, errorText);

        if (response.status === 429) {
          return { success: false, error: "Too many requests. Please wait a moment and try again.", status: 429 };
        }

        if (response.status === 402) {
          return { success: false, error: "AI credits exhausted. Please add funds to continue.", status: 402 };
        }

        if (response.status >= 500 && attempt < maxRetries) {
          lastError = `Server error ${response.status}`;
          continue;
        }

        return { success: false, error: "Failed to analyze image. Please try again.", status: 500 };
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        const errorMessage = data.error.message || "Provider error";
        console.error(`AI provider error (attempt ${attempt}):`, JSON.stringify(data.error));

        if ((errorCode === 524 || errorCode === 503 || errorCode >= 500) && attempt < maxRetries) {
          lastError = `Provider error ${errorCode}: ${errorMessage}`;
          continue;
        }

        return { 
          success: false, 
          error: errorCode === 524 
            ? "AI service timed out. Please try again with a smaller image or fewer marketplaces."
            : "AI service error. Please try again.", 
          status: 500 
        };
      }

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== "generate_metadata") {
        console.error(`Unexpected AI response format (attempt ${attempt}):`, JSON.stringify(data).slice(0, 500));
        
        if (attempt < maxRetries) {
          lastError = "Unexpected response format";
          continue;
        }

        return { success: false, error: "Could not analyze image. Please try a different image.", status: 500 };
      }

      return { success: true, data };
      
    } catch (err) {
      console.error(`Network error (attempt ${attempt}):`, err);
      lastError = err instanceof Error ? err.message : "Network error";
      
      if (attempt < maxRetries) {
        continue;
      }
    }
  }

  return { success: false, error: `Failed after retries: ${lastError}`, status: 500 };
}

function getApiKeys(): string[] {
  const keys: string[] = [];
  const primary = Deno.env.get("LOVABLE_API_KEY");
  const fallback = Deno.env.get("LOVABLE_API_KEY_FALLBACK");
  if (primary) keys.push(primary);
  if (fallback) keys.push(fallback);
  return keys;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { imageUrl, marketplaces, keywordCount = 30, titleMaxChars = 200, descriptionMaxChars = 500 } = await req.json();

    const validKeywordCount = Math.max(1, Math.min(50, Number(keywordCount) || 30));
    const validTitleMaxChars = Math.max(10, Math.min(200, Number(titleMaxChars) || 200));
    const validDescriptionMaxChars = Math.max(50, Math.min(500, Number(descriptionMaxChars) || 500));

    if (!imageUrl || !marketplaces || !Array.isArray(marketplaces) || marketplaces.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageUrl and marketplaces array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const marketplaceInstructions = marketplaces
      .map((mp: string) => {
        const guidelines = MARKETPLACE_GUIDELINES[mp] || { 
          titleStyle: "Descriptive and professional", 
          keywordFocus: "Relevant search terms",
          descriptionStyle: "Detailed description of image content and use cases"
        };
        return `
### ${mp}
- Title style: ${guidelines.titleStyle}
- Keyword focus: ${guidelines.keywordFocus}
- Description style: ${guidelines.descriptionStyle}`;
      })
      .join("\n");

    const systemPrompt = `You are an expert stock photography metadata specialist with deep knowledge of Adobe Stock, Shutterstock, and Freepik marketplaces. Your job is to analyze images and generate optimized titles, descriptions, and keywords that maximize discoverability and sales.

## Guidelines for Analysis
1. Carefully examine the image for: main subjects, colors, mood, composition, style, setting, and potential use cases
2. Consider both literal content and conceptual/emotional themes
3. Generate marketplace-specific metadata optimized for each platform's search algorithms

## Marketplace-Specific Guidelines
${marketplaceInstructions}

## Output Requirements
- Titles: EXACTLY ${validTitleMaxChars} characters (not more, not less). Fill the exact character count with descriptive, SEO-optimized content. MUST generate a title.
- Descriptions: EXACTLY ${validDescriptionMaxChars} characters (not more, not less). Fill the exact character count with detailed description of image content, style, mood, and potential use cases. MUST generate a description.
- Keywords: Exactly ${validKeywordCount} unique, relevant terms per marketplace. Include:
  - Main subjects and objects
  - Colors and visual elements
  - Mood and atmosphere
  - Style and composition terms
  - Potential use cases and contexts
  - Related concepts and themes
  - Technical photography terms where relevant

CRITICAL: Title MUST be EXACTLY ${validTitleMaxChars} characters. Description MUST be EXACTLY ${validDescriptionMaxChars} characters. Count characters carefully and adjust wording to match the exact count. Never leave any field empty.`;

    const userPrompt = `Analyze this image and generate optimized metadata for the following marketplaces: ${marketplaces.join(", ")}.

Image URL: ${imageUrl}

For each marketplace, you MUST generate:
1. A title that is EXACTLY ${validTitleMaxChars} characters (count carefully, not more, not less)
2. A description that is EXACTLY ${validDescriptionMaxChars} characters (count carefully, not more, not less)  
3. Exactly ${validKeywordCount} keywords

Follow the platform-specific guidelines for each marketplace. CHARACTER COUNTS MUST BE EXACT.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_metadata",
          description: "Generate marketplace-optimized titles, descriptions, and keywords for a stock image",
          parameters: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    marketplace: { 
                      type: "string",
                      description: "The marketplace name (Adobe Stock, Shutterstock, or Freepik)"
                    },
                    title: { 
                      type: "string",
                      description: `SEO-optimized title, EXACTLY ${validTitleMaxChars} characters. Required field.`
                    },
                    description: {
                      type: "string",
                      description: `Detailed description of image content, style, and use cases, EXACTLY ${validDescriptionMaxChars} characters. Required field.`
                    },
                    keywords: { 
                      type: "array",
                      items: { type: "string" },
                      description: `Array of exactly ${validKeywordCount} relevant keywords`
                    }
                  },
                  required: ["marketplace", "title", "description", "keywords"],
                  additionalProperties: false
                }
              }
            },
            required: ["results"],
            additionalProperties: false
          }
        }
      }
    ];

    console.log("Calling Lovable AI for image analysis...");
    console.log("Image URL:", imageUrl);
    console.log("Marketplaces:", marketplaces);
    console.log("User:", userCredits.userId, "Credits:", userCredits.currentCredits);

    const requestBody = {
      model: "stepfun/step-3.5-flash:free",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      tools,
      tool_choice: { type: "function", function: { name: "generate_metadata" } },
    };

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      console.error("No LOVABLE_API_KEY configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try keys in order: primary then fallback(s)
    let result = { success: false, error: "No API keys tried", status: 500 } as any;
    for (let i = 0; i < apiKeys.length; i++) {
      const key = apiKeys[i];
      if (i > 0) console.log("Attempting fallback API key...");
      result = await callAIWithRetry(key, requestBody);
      if (result.success) break;
      if (result.status !== 402) break; // only try fallback when provider reports payment required
    }
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credit after successful generation (skip for admin/unlimited)
    if (!userCredits.isAdmin && !userCredits.isUnlimited) {
      try {
        await deductCredit(userCredits.userId);
      } catch (creditError) {
        console.error("Failed to deduct credit:", creditError);
        // Don't fail the request if credit deduction fails - just log it
      }
    }

    const data = result.data as any;

    // Defensive checks for expected tool call structure
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Unexpected AI response structure:", JSON.stringify(data).slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format from provider", provider: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received successfully");

    let metadata: any;
    try {
      metadata = JSON.parse(toolCall.function.arguments);
    } catch (err) {
      console.error("Failed to parse AI tool call arguments:", err, "raw:", toolCall.function.arguments?.slice?.(0, 1000));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", details: String(err), providerRaw: toolCall.function.arguments }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Post-process to enforce exact character counts
    // Filler words for natural padding
    const fillerWords = ["professional", "quality", "design", "creative", "modern", "style", "concept", "visual", "artistic", "elegant", "unique", "versatile", "stunning", "beautiful", "perfect"];
    
    if (metadata.results && Array.isArray(metadata.results)) {
      metadata.results = metadata.results.map((item: { marketplace: string; title: string; description: string; keywords: string[] }) => {
        // Enforce exact title character count
        let title = (item.title || "").trim();
        if (title.length < validTitleMaxChars) {
          // Pad with relevant content words, not dots
          const contentWords = title.split(" ").filter(w => w.length > 3);
          const allWords = [...contentWords, ...fillerWords];
          let wordIndex = 0;
          while (title.length < validTitleMaxChars) {
            const word = allWords[wordIndex % allWords.length];
            const remaining = validTitleMaxChars - title.length;
            if (remaining > word.length + 1) {
              title = title + " " + word;
            } else if (remaining > 1) {
              // Add shorter filler words
              const shortWords = ["art", "for", "and", "use", "new"];
              const shortWord = shortWords.find(w => w.length === remaining - 1);
              if (shortWord) {
                title = title + " " + shortWord;
              } else {
                title = title.padEnd(validTitleMaxChars);
              }
            } else {
              title = title.padEnd(validTitleMaxChars);
            }
            wordIndex++;
            if (wordIndex > 50) break; // Safety limit
          }
        } else if (title.length > validTitleMaxChars) {
          // Truncate cleanly at word boundary without adding dots
          title = title.substring(0, validTitleMaxChars);
          // Find last complete word
          const lastSpace = title.lastIndexOf(" ");
          if (lastSpace > validTitleMaxChars - 15 && lastSpace > 0) {
            // Truncate at word boundary and pad with spaces
            title = title.substring(0, lastSpace).padEnd(validTitleMaxChars);
          }
        }
        
        // Enforce exact description character count
        let description = (item.description || "").trim();
        if (description.length < validDescriptionMaxChars) {
          // Pad with relevant content words
          const contentWords = description.split(" ").filter(w => w.length > 3);
          const descFillers = ["This image is perfect for various creative projects.", "Ideal for commercial and editorial use.", "High quality visual content for modern designs."];
          let fillerIndex = 0;
          
          // First try adding filler sentences
          while (description.length < validDescriptionMaxChars && fillerIndex < descFillers.length) {
            const remaining = validDescriptionMaxChars - description.length;
            const filler = descFillers[fillerIndex];
            if (remaining > filler.length + 1) {
              description = description + " " + filler;
            }
            fillerIndex++;
          }
          
          // Then add individual words if still short
          const allWords = [...contentWords, ...fillerWords];
          let wordIndex = 0;
          while (description.length < validDescriptionMaxChars) {
            const word = allWords[wordIndex % allWords.length];
            const remaining = validDescriptionMaxChars - description.length;
            if (remaining > word.length + 1) {
              description = description + " " + word;
            } else {
              description = description.padEnd(validDescriptionMaxChars);
            }
            wordIndex++;
            if (wordIndex > 100) break; // Safety limit
          }
        } else if (description.length > validDescriptionMaxChars) {
          // Truncate cleanly at word boundary without adding dots
          description = description.substring(0, validDescriptionMaxChars);
          const lastSpace = description.lastIndexOf(" ");
          if (lastSpace > validDescriptionMaxChars - 20 && lastSpace > 0) {
            description = description.substring(0, lastSpace).padEnd(validDescriptionMaxChars);
          }
        }
        
        return {
          ...item,
          title: title.substring(0, validTitleMaxChars),
          description: description.substring(0, validDescriptionMaxChars),
        };
      });
    }
    
    console.log("Generated metadata for", metadata.results?.length, "marketplaces");

    return new Response(
      JSON.stringify(metadata),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
