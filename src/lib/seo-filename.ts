/**
 * SEO Filename Generator
 * Creates marketplace-optimized filenames from metadata
 */

export interface SEOFilenameOptions {
  title: string;
  keywords: string[];
  marketplace: string;
  originalExtension: string;
  maxLength?: number;
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Sanitize text for use in filename:
 * - Capitalize each word
 * - Use spaces as separators
 * - Remove special characters except spaces
 */
function sanitizeForFilename(text: string): string {
  return text
    .replace(/[_-]+/g, " ") // hyphens and underscores to spaces
    .replace(/[^a-zA-Z0-9\s]/g, "") // remove special chars except spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

/**
 * Extract the most relevant keywords (prioritize shorter, common terms)
 */
function extractTopKeywords(keywords: string[], maxCount: number = 5): string[] {
  // Sort by length (shorter keywords are often more searchable)
  // and filter out very long compound terms
  const sorted = [...keywords]
    .filter((k) => k.length <= 25) // skip very long keywords
    .sort((a, b) => a.length - b.length);

  // Take the first maxCount unique sanitized keywords
  const seen = new Set<string>();
  const result: string[] = [];

  for (const keyword of sorted) {
    const sanitized = sanitizeForFilename(keyword);
    if (sanitized && !seen.has(sanitized)) {
      seen.add(sanitized);
      result.push(sanitized);
      if (result.length >= maxCount) break;
    }
  }

  return result;
}

/**
 * Get marketplace-specific prefix
 */
function getMarketplacePrefix(marketplace: string): string {
  const prefixes: Record<string, string> = {
    "Adobe Stock": "adobe",
    Shutterstock: "shutterstock",
    Freepik: "freepik",
  };
  return prefixes[marketplace] || sanitizeForFilename(marketplace);
}

/**
 * Generate an SEO-optimized filename for a specific marketplace
 */
export function generateSEOFilename(options: SEOFilenameOptions): string {
  const {
    title,
    keywords,
    originalExtension,
    maxLength = 100,
  } = options;

  // Extract key terms from title (first 2-3 words)
  const titleWords = sanitizeForFilename(title).split(" ").slice(0, 3);

  // Get top keywords
  const topKeywords = extractTopKeywords(keywords, 5);

  // Combine: title words + keywords (no marketplace prefix)
  const parts = [...titleWords, ...topKeywords];

  // Remove duplicates while preserving order (case-insensitive comparison)
  const uniqueParts: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (part && !seen.has(lowerPart)) {
      seen.add(lowerPart);
      uniqueParts.push(part);
    }
  }

  // Build filename within max length (using spaces)
  let filename = "";
  for (const part of uniqueParts) {
    const candidate = filename ? `${filename} ${part}` : part;
    if (candidate.length <= maxLength) {
      filename = candidate;
    } else {
      break;
    }
  }

  // Ensure we have something
  if (!filename) {
    filename = `Image ${Date.now()}`;
  }

  // Add extension (normalize it)
  const ext = originalExtension.toLowerCase().replace(/^\./, "");
  return `${filename}.${ext}`;
}

/**
 * Generate SEO filenames for all marketplaces at once
 */
export function generateAllSEOFilenames(
  marketplaces: Array<{
    name: string;
    title: string;
    keywords: string[];
  }>,
  originalExtension: string
): Array<{ marketplace: string; filename: string }> {
  return marketplaces.map((mp) => ({
    marketplace: mp.name,
    filename: generateSEOFilename({
      title: mp.title,
      keywords: mp.keywords,
      marketplace: mp.name,
      originalExtension,
    }),
  }));
}
