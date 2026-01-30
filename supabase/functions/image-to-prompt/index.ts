import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PromptStyle = "midjourney" | "dalle" | "stable-diffusion" | "general";
type DetailLevel = "basic" | "detailed" | "expert";

interface TrainingContext {
  trainingStrength?: number; // 0-1 range
  preferences?: {
    tone?: string;
    length?: string;
    includeKeywords?: string[];
    excludeKeywords?: string[];
    customInstructions?: string;
  };
  positiveExamples?: Array<{ prompt: string; style: string; notes?: string }>;
  negativeExamples?: Array<{ prompt: string; style: string; notes?: string }>;
  likedPrompts?: string[];
  dislikedPrompts?: string[];
}

interface RequestBody {
  imageUrl: string;
  style: PromptStyle;
  detailLevel: DetailLevel;
  trainingContext?: TrainingContext | null;
}

function getSystemPrompt(
  style: PromptStyle,
  detailLevel: DetailLevel,
  training?: TrainingContext | null
): string {
  const styleInstructions: Record<PromptStyle, string> = {
    midjourney: `Generate a prompt optimized for Midjourney v6. Include:
- Natural language description of the scene
- Style references (photography, illustration, 3D render, etc.)
- Lighting and atmosphere details
- Optional parameters at the end like --ar 16:9, --stylize 500, --chaos 20
- Use :: for weight emphasis where appropriate`,
    dalle: `Generate a prompt optimized for DALL-E 3. Include:
- Clear, descriptive natural language
- Specific art style or medium references
- Mood and atmosphere descriptions
- Composition and framing details
- Avoid technical parameters, focus on vivid descriptions`,
    "stable-diffusion": `Generate a prompt optimized for Stable Diffusion. Include:
- Comma-separated tags and descriptors
- Quality boosters like "masterpiece, best quality, highly detailed"
- Style tags (photorealistic, anime, oil painting, etc.)
- Emphasis using (parentheses) for important elements
- Optionally suggest a negative prompt for common issues`,
    general: `Generate a universal prompt that works across AI image generators. Include:
- Clear subject description
- Art style and medium
- Lighting and color palette
- Composition and perspective
- Mood and atmosphere`,
  };

  const detailInstructions: Record<DetailLevel, string> = {
    basic: "Keep the prompt concise, around 50-100 words. Focus on the essential elements only.",
    detailed: "Provide a comprehensive prompt of 150-250 words. Include style, lighting, composition, and mood.",
    expert: "Generate an extensive prompt of 300+ words. Include technical details about lighting, camera angles, color grading, artistic influences, and detailed composition analysis.",
  };

  // Build training-aware instructions
  let trainingInstructions = "";
  
  if (training) {
    const parts: string[] = [];
    const strength = training.trainingStrength ?? 0.75;
    
    // Add strength context
    if (strength < 0.25) {
      parts.push("TRAINING INFLUENCE: Minimal. Focus on creative analysis with light consideration of user preferences.");
    } else if (strength < 0.5) {
      parts.push("TRAINING INFLUENCE: Moderate. Balance your analysis with user preferences.");
    } else if (strength < 0.75) {
      parts.push("TRAINING INFLUENCE: Strong. Closely follow user preferences and examples.");
    } else {
      parts.push("TRAINING INFLUENCE: Maximum. Strictly adhere to user preferences and examples.");
    }
    
    // User preferences
    if (training.preferences) {
      const prefs = training.preferences;
      
      if (prefs.tone && prefs.tone !== "neutral") {
        parts.push(`Use a ${prefs.tone} tone in your descriptions.`);
      }
      
      if (prefs.length) {
        const lengthMap: Record<string, string> = {
          short: "Keep the prompt concise and brief.",
          medium: "Use a moderate length for the prompt.",
          long: "Be thorough and extensive in your prompt.",
        };
        if (lengthMap[prefs.length]) {
          parts.push(lengthMap[prefs.length]);
        }
      }
      
      if (prefs.includeKeywords && prefs.includeKeywords.length > 0) {
        parts.push(`Try to incorporate these keywords/phrases when appropriate: ${prefs.includeKeywords.join(", ")}`);
      }
      
      if (prefs.excludeKeywords && prefs.excludeKeywords.length > 0) {
        parts.push(`Avoid using these words/phrases: ${prefs.excludeKeywords.join(", ")}`);
      }
      
      if (prefs.customInstructions) {
        parts.push(`Additional instructions: ${prefs.customInstructions}`);
      }
    }
    
    // Positive examples
    if (training.positiveExamples && training.positiveExamples.length > 0) {
      parts.push("\n--- GOOD EXAMPLES (emulate this style) ---");
      training.positiveExamples.forEach((ex, i) => {
        parts.push(`Example ${i + 1}: "${ex.prompt}"${ex.notes ? ` (Note: ${ex.notes})` : ""}`);
      });
    }
    
    // Negative examples
    if (training.negativeExamples && training.negativeExamples.length > 0) {
      parts.push("\n--- BAD EXAMPLES (avoid this style) ---");
      training.negativeExamples.forEach((ex, i) => {
        parts.push(`Avoid: "${ex.prompt}"${ex.notes ? ` (Note: ${ex.notes})` : ""}`);
      });
    }
    
    // Feedback patterns
    if (training.likedPrompts && training.likedPrompts.length > 0) {
      parts.push(`\nThe user previously liked prompts similar to: ${training.likedPrompts.slice(0, 2).map(p => `"${p.slice(0, 100)}..."`).join(", ")}`);
    }
    
    if (training.dislikedPrompts && training.dislikedPrompts.length > 0) {
      parts.push(`The user previously disliked prompts similar to: ${training.dislikedPrompts.slice(0, 2).map(p => `"${p.slice(0, 100)}..."`).join(", ")}`);
    }
    
    if (parts.length > 0) {
      trainingInstructions = `\n\n--- USER PREFERENCES & TRAINING DATA ---\n${parts.join("\n")}`;
    }
  }

  return `You are an expert AI image prompt engineer. Analyze the provided image and generate a text prompt that could be used to recreate a similar image using AI image generators.

${styleInstructions[style]}

${detailInstructions[detailLevel]}

Focus on:
1. Main subject and its characteristics
2. Background and environment
3. Lighting conditions and shadows
4. Color palette and tones
5. Art style and medium
6. Composition and framing
7. Mood and atmosphere
8. Any unique or distinctive elements

Be specific and descriptive. The goal is to create a prompt that would generate an image as close to the original as possible.${trainingInstructions}`;
}

async function callAIWithRetry(
  payload: object,
  apiKey: string,
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 429) {
        throw new Error("RATE_LIMITED");
      }

      if (response.status === 402) {
        throw new Error("PAYMENT_REQUIRED");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI gateway error (attempt ${attempt + 1}):`, response.status, errorText);

        // Try to extract a useful provider message
        let providerMessage = "";
        try {
          const parsed = JSON.parse(errorText);
          providerMessage = parsed?.error?.message ?? "";
        } catch {
          providerMessage = errorText;
        }

        // Non-retryable: unsupported image types (e.g., AVIF URLs)
        if (providerMessage.includes("Unsupported image format")) {
          throw new Error("UNSUPPORTED_IMAGE_FORMAT");
        }
        
        if (response.status === 503 || response.status === 524) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }

        // Non-retryable generic
        throw new Error(`AI_GATEWAY_${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (
        lastError.message === "RATE_LIMITED" ||
        lastError.message === "PAYMENT_REQUIRED" ||
        lastError.message === "UNSUPPORTED_IMAGE_FORMAT" ||
        lastError.message.startsWith("AI_GATEWAY_")
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt + 1} after error:`, lastError.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { imageUrl, style = "general", detailLevel = "detailed", trainingContext } = body;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasTraining = trainingContext && (
      trainingContext.positiveExamples?.length ||
      trainingContext.negativeExamples?.length ||
      trainingContext.likedPrompts?.length ||
      trainingContext.dislikedPrompts?.length ||
      trainingContext.preferences?.customInstructions ||
      (trainingContext.preferences?.includeKeywords?.length ?? 0) > 0 ||
      (trainingContext.preferences?.excludeKeywords?.length ?? 0) > 0
    );

    console.log(`Generating prompt for image, style: ${style}, detail: ${detailLevel}, trained: ${!!hasTraining}`);

    const systemPrompt = getSystemPrompt(style, detailLevel, trainingContext);

    const payload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and generate a detailed prompt that could recreate it.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_prompt",
            description: "Generate an AI image prompt based on the analyzed image",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The generated prompt text",
                },
                negativePrompt: {
                  type: "string",
                  description: "Optional negative prompt for Stable Diffusion style (things to avoid)",
                },
                suggestedAspectRatio: {
                  type: "string",
                  description: "Suggested aspect ratio based on the image (e.g., 16:9, 1:1, 4:3)",
                },
                dominantColors: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of dominant colors in the image",
                },
                artStyle: {
                  type: "string",
                  description: "Detected or suggested art style",
                },
              },
              required: ["prompt"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_prompt" } },
    };

    const response = await callAIWithRetry(payload, LOVABLE_API_KEY);
    const data = await response.json();

    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_prompt") {
      console.error("Unexpected AI response format:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to generate prompt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        prompt: result.prompt,
        negativePrompt: result.negativePrompt || null,
        suggestedAspectRatio: result.suggestedAspectRatio || null,
        dominantColors: result.dominantColors || [],
        artStyle: result.artStyle || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in image-to-prompt:", error);

    if (error instanceof Error) {
      if (error.message === "RATE_LIMITED") {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (error.message === "PAYMENT_REQUIRED") {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (error.message === "UNSUPPORTED_IMAGE_FORMAT") {
        return new Response(
          JSON.stringify({
            error: "Unsupported image format. Please upload PNG, JPEG, WebP, or GIF.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (error.message.startsWith("AI_GATEWAY_")) {
        const status = Number(error.message.replace("AI_GATEWAY_", ""));
        const safeStatus = Number.isFinite(status) ? status : 500;
        // Keep message generic to avoid leaking provider internals
        return new Response(
          JSON.stringify({ error: "AI gateway error. Please try again." }),
          {
            status: safeStatus >= 400 && safeStatus < 500 ? safeStatus : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Failed to generate prompt. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
