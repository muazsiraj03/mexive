export type PromptStyle = "midjourney" | "dalle" | "stable-diffusion" | "general";
export type DetailLevel = "basic" | "detailed" | "expert";

export interface PromptResult {
  prompt: string;
  negativePrompt: string | null;
  suggestedAspectRatio: string | null;
  dominantColors: string[];
  artStyle: string | null;
}

export interface PromptConfig {
  style: PromptStyle;
  detailLevel: DetailLevel;
}

export const PROMPT_STYLES: { value: PromptStyle; label: string; description: string }[] = [
  {
    value: "midjourney",
    label: "Midjourney",
    description: "Optimized for MJ v6 with parameters",
  },
  {
    value: "dalle",
    label: "DALL-E",
    description: "Natural language for OpenAI models",
  },
  {
    value: "stable-diffusion",
    label: "Stable Diffusion",
    description: "Tag-based with weights",
  },
  {
    value: "general",
    label: "General",
    description: "Universal prompt format",
  },
];

export const DETAIL_LEVELS: { value: DetailLevel; label: string; description: string }[] = [
  {
    value: "basic",
    label: "Basic",
    description: "50-100 words, essential elements",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "150-250 words, comprehensive",
  },
  {
    value: "expert",
    label: "Expert",
    description: "300+ words, full technical breakdown",
  },
];

export function downloadPromptAsText(prompt: string, filename: string = "prompt.txt"): void {
  const blob = new Blob([prompt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
