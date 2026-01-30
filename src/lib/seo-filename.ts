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
 * Sanitize text for use in filename:
 * - lowercase
 * - replace spaces/underscores with hyphens
 * - remove special characters
 * - collapse multiple hyphens
 */
function sanitizeForFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_\s]+/g, "-") // spaces and underscores to hyphens
    .replace(/[^a-z0-9-]/g, "") // remove special chars
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
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
    marketplace,
    originalExtension,
    maxLength = 100,
  } = options;

  // Get marketplace prefix
  const prefix = getMarketplacePrefix(marketplace);

  // Extract key terms from title (first 2-3 words)
  const titleWords = sanitizeForFilename(title).split("-").slice(0, 3);

  // Get top keywords
  const topKeywords = extractTopKeywords(keywords, 5);

  // Combine: marketplace prefix + title words + keywords
  const parts = [prefix, ...titleWords, ...topKeywords];

  // Remove duplicates while preserving order
  const uniqueParts: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (part && !seen.has(part)) {
      seen.add(part);
      uniqueParts.push(part);
    }
  }

  // Build filename within max length
  let filename = "";
  for (const part of uniqueParts) {
    const candidate = filename ? `${filename}-${part}` : part;
    if (candidate.length <= maxLength) {
      filename = candidate;
    } else {
      break;
    }
  }

  // Ensure we have something
  if (!filename) {
    filename = `${prefix}-image-${Date.now()}`;
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
