/**
 * File Downloader Utility
 * Handles downloading images with SEO-optimized filenames and embedded metadata
 * Uses edge function for reliable downloads in all environments (including iframes)
 */

import JSZip from "jszip";
import { ImageMetadata } from "./metadata-embedder";
import { getXMPFilename, needsXMPSidecar } from "./xmp-generator";

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
    const title = metadata.title || "";
    const description = metadata.description || "";
    const keywords = Array.isArray(metadata.keywords) ? metadata.keywords.join(",") : "";
    
    params.set("title", title);
    params.set("description", description);
    params.set("keywords", keywords);
  }
  
  return `${DOWNLOAD_FUNCTION_URL}?${params.toString()}`;
}

/**
 * Download a single image with an SEO-optimized filename (direct download, no ZIP)
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
 * Download a single image directly with embedded metadata (no ZIP wrapper)
 * This is the preferred method for single marketplace downloads
 */
export async function downloadSingleImage(
  imageUrl: string,
  filename: string,
  metadata?: ImageMetadata
): Promise<void> {
  // Use the edge function approach which handles metadata embedding server-side
  const downloadUrl = buildDownloadUrl(imageUrl, filename, metadata, "image");
  downloadByNavigatingToUrl(downloadUrl);
  
  // For non-JPEG files, also download XMP sidecar after a delay
  if (metadata && needsXMPSidecar(filename)) {
    await delay(500);
    const xmpUrl = buildDownloadUrl(imageUrl, filename, metadata, "xmp");
    downloadByNavigatingToUrl(xmpUrl);
  }
}

/**
 * Fetch processed image from edge function with embedded metadata
 */
async function fetchProcessedImage(
  imageUrl: string,
  filename: string,
  metadata?: ImageMetadata
): Promise<Blob> {
  const downloadUrl = buildDownloadUrl(imageUrl, filename, metadata, "image");
  
  console.log("fetchProcessedImage - URL:", downloadUrl);
  console.log("fetchProcessedImage - Metadata:", metadata);
  
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    console.error("Failed to fetch processed image:", response.status, response.statusText);
    throw new Error(`Failed to fetch processed image: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  console.log("fetchProcessedImage - Got blob, size:", blob.size);
  return blob;
}

/**
 * Fetch XMP sidecar from edge function
 */
async function fetchXMPSidecar(
  imageUrl: string,
  filename: string,
  metadata: ImageMetadata
): Promise<Blob> {
  const xmpUrl = buildDownloadUrl(imageUrl, filename, metadata, "xmp");
  const response = await fetch(xmpUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch XMP sidecar: ${response.statusText}`);
  }
  return response.blob();
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

  // Add each marketplace version to the ZIP (with embedded metadata via edge function)
  for (const { filename, metadata } of marketplaceFilenames) {
    // Use edge function to get properly processed image with metadata
    const processedBlob = metadata 
      ? await fetchProcessedImage(imageUrl, filename, metadata)
      : await fetchImageAsBlob(imageUrl);
    
    // Convert blob to Uint8Array for reliable binary handling in JSZip
    const arrayBuffer = await processedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    zip.file(filename, uint8Array, { binary: true });
    
    // For non-JPEG files, add XMP sidecar to ZIP
    if (metadata && needsXMPSidecar(filename)) {
      const xmpBlob = await fetchXMPSidecar(imageUrl, filename, metadata);
      const xmpArrayBuffer = await xmpBlob.arrayBuffer();
      const xmpUint8Array = new Uint8Array(xmpArrayBuffer);
      const xmpFilename = getXMPFilename(filename);
      zip.file(xmpFilename, xmpUint8Array, { binary: true });
    }
  }

  // Generate and download the ZIP with STORE compression to preserve metadata
  const zipBlob = await zip.generateAsync({ 
    type: "blob",
    compression: "STORE" // No compression to preserve EXIF/XMP metadata integrity
  });
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
  console.log("downloadBatchAsZip called with", files.length, "files");
  
  const zip = new JSZip();

  // Process each file
  for (const file of files) {
    console.log("Processing file:", file.baseName, "with", file.marketplaces.length, "marketplaces");
    
    // Add each marketplace version directly to root (use edge function for metadata)
    for (const { filename, metadata } of file.marketplaces) {
      console.log("Processing marketplace file:", filename, "metadata:", metadata);
      
      // Use edge function to get properly processed image with metadata
      const processedBlob = metadata 
        ? await fetchProcessedImage(file.imageUrl, filename, metadata)
        : await fetchImageAsBlob(file.imageUrl);
      
      // Convert blob to Uint8Array for reliable binary handling in JSZip
      const arrayBuffer = await processedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log("Adding to ZIP:", filename, "size:", uint8Array.length, "first bytes:", uint8Array.slice(0, 20));
      zip.file(filename, uint8Array, { binary: true });
      
      // For non-JPEG files, add XMP sidecar
      if (metadata && needsXMPSidecar(filename)) {
        const xmpBlob = await fetchXMPSidecar(file.imageUrl, filename, metadata);
        const xmpArrayBuffer = await xmpBlob.arrayBuffer();
        const xmpUint8Array = new Uint8Array(xmpArrayBuffer);
        const xmpFilename = getXMPFilename(filename);
        zip.file(xmpFilename, xmpUint8Array, { binary: true });
      }
    }
  }

  // Generate and download the ZIP with STORE compression to preserve metadata
  console.log("Generating ZIP file with STORE compression...");
  const zipBlob = await zip.generateAsync({ 
    type: "blob",
    compression: "STORE" // No compression to preserve EXIF/XMP metadata integrity
  });
  console.log("ZIP blob size:", zipBlob.size);
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
