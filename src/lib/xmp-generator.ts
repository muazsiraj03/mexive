/**
 * XMP Sidecar File Generator
 * Creates XMP sidecar files for non-JPEG images (PNG, WebP, etc.)
 * These files contain metadata that can be read by Adobe products and stock sites
 */

import { ImageMetadata } from "./metadata-embedder";

/**
 * Escape special XML characters
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
 * Generate XMP sidecar file content
 * This XML format is compatible with Adobe products and stock photography sites
 */
export function generateXMPContent(metadata: ImageMetadata): string {
  const { title, description, keywords, author, copyright } = metadata;

  // Build keywords list items
  const keywordsListItems = keywords
    .map((keyword) => `          <rdf:li>${escapeXml(keyword)}</rdf:li>`)
    .join("\n");

  const xmpContent = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
        xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      
      <!-- Dublin Core Metadata -->
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(description)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      
      <dc:subject>
        <rdf:Bag>
${keywordsListItems}
        </rdf:Bag>
      </dc:subject>
      
      ${author ? `<dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXml(author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>` : ""}
      
      ${copyright ? `<dc:rights>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(copyright)}</rdf:li>
        </rdf:Alt>
      </dc:rights>` : ""}
      
      <!-- Photoshop Metadata -->
      <photoshop:Headline>${escapeXml(title)}</photoshop:Headline>
      <photoshop:CaptionWriter>MetaGen by Lovable</photoshop:CaptionWriter>
      ${author ? `<photoshop:Credit>${escapeXml(author)}</photoshop:Credit>` : ""}
      
      <!-- XMP Basic -->
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
      
      <!-- IPTC Core -->
      <Iptc4xmpCore:IntellectualGenre>Stock Photography</Iptc4xmpCore:IntellectualGenre>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;

  return xmpContent;
}

/**
 * Create XMP sidecar file as a Blob
 */
export function createXMPBlob(metadata: ImageMetadata): Blob {
  const xmpContent = generateXMPContent(metadata);
  return new Blob([xmpContent], { type: "application/rdf+xml" });
}

/**
 * Get XMP filename for a given image filename
 * Example: "my-image.png" -> "my-image.xmp"
 */
export function getXMPFilename(imageFilename: string): string {
  const lastDotIndex = imageFilename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${imageFilename}.xmp`;
  }
  return `${imageFilename.substring(0, lastDotIndex)}.xmp`;
}

/**
 * Check if a file needs an XMP sidecar (non-JPEG files)
 */
export function needsXMPSidecar(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  // JPEG files get EXIF embedded, others need XMP sidecar
  return ext !== "jpg" && ext !== "jpeg";
}
