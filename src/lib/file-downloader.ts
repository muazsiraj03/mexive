/**
 * File Downloader Utility
 * Handles downloading images with SEO-optimized filenames and embedded metadata
 * Uses edge function for reliable downloads in all environments (including iframes)
 */

import JSZip from "jszip";
import { ImageMetadata, processImageWithMetadata } from "./metadata-embedder";
import { createXMPBlob, getXMPFilename, needsXMPSidecar } from "./xmp-generator";

const DOWNLOAD_FUNCTION_URL = "https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/download-image";

export interface DownloadOptions {
  imageUrl: string;
  filename: string;
  metadata?: ImageMetadata;
}

/**
 * Fetch image as blob from URL
 */
async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Trigger browser download for a blob with a specific filename
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);

  // Some browsers (and sandboxed iframes) are sensitive to how the click is triggered.
  // Dispatching a real MouseEvent + delaying URL revocation is the most robust pattern.
  try {
    a.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  } catch {
    a.click();
  }

  document.body.removeChild(a);

  // Delay revoke to avoid cancelling the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Trigger a download for a cross-origin URL that returns
 * `Content-Disposition: attachment` (edge function).
 *
 * We avoid `window.open()` because it is commonly blocked by popup blockers
 * (especially from dropdown/menu handlers).
 */
function downloadByNavigatingToUrl(url: string): void {
  // Hidden iframe is the most reliable way to trigger an attachment download
  // without opening a new tab or navigating away.
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);

  // Clean up later.
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // ignore
    }
  }, 60_000);
}

/**
 * Small delay helper to prevent browser blocking multiple downloads
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build edge function download URL with all parameters
 */
function buildDownloadUrl(
  imageUrl: string,
  filename: string,
  metadata?: ImageMetadata,
  format: "image" | "xmp" = "image"
): string {
  const params = new URLSearchParams({
    imageUrl,
    filename,
    format,
  });
  
  if (metadata) {
    params.set("title", metadata.title || "");
    params.set("description", metadata.description || "");
    params.set("keywords", metadata.keywords.join(","));
  }
  
  return `${DOWNLOAD_FUNCTION_URL}?${params.toString()}`;
}

/**
 * Download a single image with an SEO-optimized filename
 * Uses edge function to embed metadata and return file with proper headers
 * Works reliably in iframes since it opens a direct link
 */
export async function downloadImageWithSEOName(
  imageUrl: string,
  newFilename: string,
  metadata?: ImageMetadata
): Promise<void> {
  // Build the download URL
  const downloadUrl = buildDownloadUrl(imageUrl, newFilename, metadata, "image");

  // Trigger download without opening a new tab (works best across browsers)
  downloadByNavigatingToUrl(downloadUrl);
  
  // For non-JPEG files, also download XMP sidecar after a delay
  if (metadata && needsXMPSidecar(newFilename)) {
    await delay(500);
    const xmpUrl = buildDownloadUrl(imageUrl, newFilename, metadata, "xmp");
    downloadByNavigatingToUrl(xmpUrl);
  }
}

/**
 * Download all marketplace versions as a ZIP file
 * Each file has embedded metadata for its marketplace (JPEG) or XMP sidecar (other formats)
 */
export async function downloadAllAsZip(
  imageUrl: string,
  marketplaceFilenames: Array<{ 
    marketplace: string; 
    filename: string;
    metadata?: ImageMetadata;
  }>,
  zipFilename?: string
): Promise<void> {
  const zip = new JSZip();

  // Fetch the image once
  const imageBlob = await fetchImageAsBlob(imageUrl);

  // Add each marketplace version to the ZIP (with embedded metadata if provided)
  for (const { filename, metadata } of marketplaceFilenames) {
    let processedBlob = imageBlob;
    
    // Embed metadata if provided
    if (metadata) {
      processedBlob = await processImageWithMetadata(imageBlob, metadata, filename);
      
      // For non-JPEG files, add XMP sidecar to ZIP
      if (needsXMPSidecar(filename)) {
        const xmpBlob = createXMPBlob(metadata);
        const xmpFilename = getXMPFilename(filename);
        zip.file(xmpFilename, xmpBlob);
      }
    }
    
    zip.file(filename, processedBlob);
  }

  // Generate and download the ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const finalZipName = zipFilename || `seo-images-${Date.now()}.zip`;
  downloadBlob(zipBlob, finalZipName);
}

/**
 * Download multiple images with all their marketplace versions as a single ZIP file
 * Each image gets a folder with its marketplace-optimized versions
 */
export async function downloadBatchAsZip(
  files: Array<{
    imageUrl: string;
    baseName: string;
    marketplaces: Array<{
      marketplace: string;
      filename: string;
      metadata?: ImageMetadata;
    }>;
  }>,
  zipFilename: string
): Promise<void> {
const zip = new JSZip();

  // Process each file
  for (const file of files) {
    // Fetch the image
    const imageBlob = await fetchImageAsBlob(file.imageUrl);

    // Add each marketplace version directly to root
    for (const { filename, metadata } of file.marketplaces) {
      let processedBlob = imageBlob;

      // Embed metadata if provided
      if (metadata) {
        processedBlob = await processImageWithMetadata(imageBlob, metadata, filename);

        // For non-JPEG files, add XMP sidecar
        if (needsXMPSidecar(filename)) {
          const xmpBlob = createXMPBlob(metadata);
          const xmpFilename = getXMPFilename(filename);
          zip.file(xmpFilename, xmpBlob);
        }
      }

      zip.file(filename, processedBlob);
    }
  }

  // Generate and download the ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, zipFilename);
}

/**
 * Get file extension from filename or URL
 */
export function getFileExtension(filenameOrUrl: string): string {
  // Handle URLs by extracting pathname
  let filename = filenameOrUrl;
  try {
    const url = new URL(filenameOrUrl);
    filename = url.pathname;
  } catch {
    // Not a URL, use as-is
  }

  // Extract extension
  const match = filename.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : "jpg";
}
