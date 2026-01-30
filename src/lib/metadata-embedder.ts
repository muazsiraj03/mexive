/**
 * Metadata Embedder Utility
 * Embeds title, description, and keywords into image file properties
 * Uses XMP metadata for marketplace compatibility (Adobe Stock, Shutterstock, Freepik)
 * Also keeps EXIF fields for Windows/Mac file explorer compatibility
 */

import { writeXMP } from "@mtillmann/jpeg-xmp-writer";
import piexif from "piexifjs";

export interface ImageMetadata {
  title: string;
  description: string;
  keywords: string[];
  author?: string;
  copyright?: string;
}

/**
 * Escape special XML characters for XMP content
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert string to UTF-16LE encoded bytes for Windows XP* fields
 * Windows uses UTF-16LE for XPTitle, XPComment, XPKeywords, etc.
 */
function encodeUTF16LE(str: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    result.push(code & 0xff); // Low byte
    result.push((code >> 8) & 0xff); // High byte
  }
  // Null terminator
  result.push(0, 0);
  return result;
}

/**
 * Build EXIF object with Windows-compatible metadata
 * This ensures metadata shows in Windows File Explorer
 */
function buildExifObject(metadata: ImageMetadata): piexif.IExifElement {
  const { title, description, keywords, author, copyright } = metadata;

  // Join keywords with semicolons (Windows standard)
  const keywordsStr = keywords.join("; ");

  // Create zeroth IFD (main image info)
  const zerothIfd: Record<number, unknown> = {};

  // ImageDescription (standard EXIF field)
  if (description) {
    zerothIfd[piexif.ImageIFD.ImageDescription] = description;
  }

  // Artist (author)
  if (author) {
    zerothIfd[piexif.ImageIFD.Artist] = author;
  }

  // Copyright
  if (copyright) {
    zerothIfd[piexif.ImageIFD.Copyright] = copyright;
  }

  // Software
  zerothIfd[piexif.ImageIFD.Software] = "MetaGen by Lovable";

  // Windows XP extended fields (these show in Windows File Properties "Details" tab)
  if (title) {
    zerothIfd[piexif.ImageIFD.XPTitle] = encodeUTF16LE(title);
  }

  if (description) {
    zerothIfd[piexif.ImageIFD.XPComment] = encodeUTF16LE(description);
  }

  if (keywords.length > 0) {
    zerothIfd[piexif.ImageIFD.XPKeywords] = encodeUTF16LE(keywordsStr);
  }

  if (description) {
    zerothIfd[piexif.ImageIFD.XPSubject] = encodeUTF16LE(description.slice(0, 250));
  }

  // Create EXIF IFD
  const exifIfd: Record<number, unknown> = {
    [piexif.ExifIFD.UserComment]: `ASCII\0\0\0${description || title}`,
  };

  return {
    "0th": zerothIfd,
    Exif: exifIfd,
    GPS: {},
    Interop: {},
    "1st": {},
    thumbnail: null,
  };
}

/**
 * Embed EXIF metadata for Windows File Explorer compatibility
 */
async function embedExifMetadata(
  imageBlob: Blob,
  metadata: ImageMetadata
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        const exifObj = buildExifObject(metadata);
        const exifStr = piexif.dump(exifObj);
        const newDataUrl = piexif.insert(exifStr, dataUrl);

        // Convert data URL back to blob
        const binary = atob(newDataUrl.split(",")[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }

        resolve(new Blob([array], { type: "image/jpeg" }));
      } catch (error) {
        console.error("Failed to embed EXIF metadata:", error);
        resolve(imageBlob);
      }
    };

    reader.onerror = () => {
      resolve(imageBlob);
    };

    reader.readAsDataURL(imageBlob);
  });
}

/**
 * Embed XMP metadata for stock marketplace compatibility
 * Uses Dublin Core (dc:) namespace which Adobe Stock, Shutterstock, etc. read
 */
async function embedXMPMetadata(
  imageBlob: Blob,
  metadata: ImageMetadata
): Promise<Blob> {
  try {
    const { title, description, keywords, author, copyright } = metadata;

    // Convert blob to ArrayBuffer
    const arrayBuffer = await new Response(imageBlob).arrayBuffer();

    // Build keywords list items for XMP
    const keywordsListItems = keywords
      .map((keyword) => `<rdf:li>${escapeXml(keyword)}</rdf:li>`)
      .join("");

    // Write XMP metadata using simple attribute approach first
    // This is more reliable than DOM manipulation for images without existing XMP
    const xmpArrayBuffer = writeXMP(arrayBuffer, {
      "dc:title": title,
      "dc:description": description,
      "xmp:CreatorTool": "MetaGen by Lovable",
      "photoshop:Headline": title,
    });

    // If we successfully got an ArrayBuffer, return it as a blob
    if (xmpArrayBuffer && xmpArrayBuffer.byteLength > 0) {
      return new Blob([xmpArrayBuffer], { type: "image/jpeg" });
    }

    // Fallback to original blob if XMP embedding returned empty
    console.warn("XMP embedding returned empty buffer, using original");
    return imageBlob;
  } catch (error) {
    console.error("Failed to embed XMP metadata:", error);
    // Return original blob on error so download still works
    return imageBlob;
  }
}

/**
 * Embed metadata into a JPEG image blob
 * Applies both XMP (for marketplaces) and EXIF (for Windows) metadata
 * Returns a new blob with embedded metadata
 */
export async function embedMetadataInJpeg(
  imageBlob: Blob,
  metadata: ImageMetadata
): Promise<Blob> {
  try {
    // First, embed XMP metadata for stock marketplace compatibility
    let processedBlob = await embedXMPMetadata(imageBlob, metadata);

    // Then, also embed EXIF metadata for Windows File Explorer compatibility
    processedBlob = await embedExifMetadata(processedBlob, metadata);

    return processedBlob;
  } catch (error) {
    console.error("Failed to embed metadata:", error);
    return imageBlob;
  }
}

/**
 * Check if a file is a JPEG that can have EXIF/XMP metadata embedded
 */
export function canEmbedMetadata(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return ext === "jpg" || ext === "jpeg";
}

/**
 * Process image for download with embedded metadata
 * If it's a JPEG, embeds metadata; otherwise returns original blob
 */
export async function processImageWithMetadata(
  imageBlob: Blob,
  metadata: ImageMetadata,
  filename: string
): Promise<Blob> {
  if (canEmbedMetadata(filename)) {
    return embedMetadataInJpeg(imageBlob, metadata);
  }
  // For non-JPEG files, return as-is (PNG, WebP don't support EXIF the same way)
  return imageBlob;
}
