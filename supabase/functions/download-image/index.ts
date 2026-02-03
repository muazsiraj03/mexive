const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImageMetadata {
  title: string;
  description: string;
  keywords: string[];
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
 * Generate XMP sidecar file content
 */
function generateXMPContent(metadata: ImageMetadata): string {
  const { title, description, keywords } = metadata;

  const keywordsListItems = keywords
    .map((keyword) => `          <rdf:li>${escapeXml(keyword)}</rdf:li>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
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
      <photoshop:Headline>${escapeXml(title)}</photoshop:Headline>
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
}

/**
 * Encode string to UTF-16LE for Windows XP* EXIF fields
 */
function encodeUTF16LE(str: string): Uint8Array {
  const result = new Uint8Array(str.length * 2 + 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    result[i * 2] = code & 0xff;
    result[i * 2 + 1] = (code >> 8) & 0xff;
  }
  // Null terminator
  result[str.length * 2] = 0;
  result[str.length * 2 + 1] = 0;
  return result;
}

/**
 * Build EXIF APP1 segment with Windows-compatible metadata
 * Uses TIFF/EXIF structure with Windows XP extended tags
 */
function buildExifSegment(metadata: ImageMetadata): Uint8Array {
  const { title, description, keywords } = metadata;
  const keywordsStr = keywords.join("; ");

  // Encode strings to UTF-16LE for Windows XP fields
  const titleBytes = encodeUTF16LE(title);
  const descBytes = encodeUTF16LE(description);
  const keywordsBytes = encodeUTF16LE(keywordsStr);
  const subjectBytes = encodeUTF16LE(description.slice(0, 250));

  // TIFF header
  const tiffHeader = new Uint8Array([
    0x4d, 0x4d, // Big-endian ("MM")
    0x00, 0x2a, // TIFF magic number
    0x00, 0x00, 0x00, 0x08, // Offset to first IFD
  ]);

  // Calculate IFD entries
  const entries: { tag: number; type: number; count: number; value: Uint8Array }[] = [];

  // Tag 0x9c9b: XPTitle (Windows)
  if (title) {
    entries.push({ tag: 0x9c9b, type: 1, count: titleBytes.length, value: titleBytes });
  }

  // Tag 0x9c9c: XPComment (Windows)
  if (description) {
    entries.push({ tag: 0x9c9c, type: 1, count: descBytes.length, value: descBytes });
  }

  // Tag 0x9c9e: XPKeywords (Windows)
  if (keywords.length > 0) {
    entries.push({ tag: 0x9c9e, type: 1, count: keywordsBytes.length, value: keywordsBytes });
  }

  // Tag 0x9c9f: XPSubject (Windows)
  if (description) {
    entries.push({ tag: 0x9c9f, type: 1, count: subjectBytes.length, value: subjectBytes });
  }

  // ImageDescription (standard EXIF - tag 0x010e)
  const descAscii = new TextEncoder().encode(description + "\0");
  if (description) {
    entries.push({ tag: 0x010e, type: 2, count: descAscii.length, value: descAscii });
  }

  // Sort entries by tag number (required by TIFF spec)
  entries.sort((a, b) => a.tag - b.tag);

  // Calculate offsets
  const ifdEntriesSize = 2 + entries.length * 12 + 4; // count + entries + next IFD pointer
  const valuesOffset = 8 + ifdEntriesSize; // After TIFF header + IFD

  // Build IFD
  const ifdBuffer = new Uint8Array(ifdEntriesSize);
  const ifdView = new DataView(ifdBuffer.buffer);

  // Number of entries
  ifdView.setUint16(0, entries.length, false);

  let valuePos = valuesOffset;
  const valueBuffers: Uint8Array[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const offset = 2 + i * 12;

    ifdView.setUint16(offset, entry.tag, false);
    ifdView.setUint16(offset + 2, entry.type, false);
    ifdView.setUint32(offset + 4, entry.count, false);

    if (entry.value.length <= 4) {
      // Value fits in offset field
      for (let j = 0; j < entry.value.length && j < 4; j++) {
        ifdBuffer[offset + 8 + j] = entry.value[j];
      }
    } else {
      // Value stored after IFD, point to it
      ifdView.setUint32(offset + 8, valuePos, false);
      valueBuffers.push(entry.value);
      valuePos += entry.value.length;
      // Pad to word boundary
      if (entry.value.length % 2 !== 0) {
        valueBuffers.push(new Uint8Array([0]));
        valuePos += 1;
      }
    }
  }

  // Next IFD pointer (0 = no more IFDs)
  ifdView.setUint32(2 + entries.length * 12, 0, false);

  // Combine all parts
  let totalSize = tiffHeader.length + ifdBuffer.length;
  for (const buf of valueBuffers) {
    totalSize += buf.length;
  }

  const tiffData = new Uint8Array(totalSize);
  let pos = 0;
  tiffData.set(tiffHeader, pos);
  pos += tiffHeader.length;
  tiffData.set(ifdBuffer, pos);
  pos += ifdBuffer.length;
  for (const buf of valueBuffers) {
    tiffData.set(buf, pos);
    pos += buf.length;
  }

  // Build APP1 segment
  const exifHeader = new TextEncoder().encode("Exif\0\0");
  const app1Length = 2 + exifHeader.length + tiffData.length;

  const app1Segment = new Uint8Array(2 + app1Length);
  app1Segment[0] = 0xff;
  app1Segment[1] = 0xe1;
  app1Segment[2] = (app1Length >> 8) & 0xff;
  app1Segment[3] = app1Length & 0xff;
  app1Segment.set(exifHeader, 4);
  app1Segment.set(tiffData, 4 + exifHeader.length);

  return app1Segment;
}

/**
 * Embed XMP metadata into JPEG using APP1 marker
 */
function buildXMPSegment(metadata: ImageMetadata): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    return new Uint8Array(0);
  }

  const safeTitle = escapeXml(metadata.title || "");
  const safeDescription = escapeXml(metadata.description || "");
  const keywordItems = metadata.keywords
    .filter((k) => k && k.trim())
    .map((k) => `          <rdf:li>${escapeXml(k)}</rdf:li>`)
    .join("\n");

  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
        xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeTitle}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeDescription}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
${keywordItems}
        </rdf:Bag>
      </dc:subject>
      <photoshop:Headline>${safeTitle}</photoshop:Headline>
      <photoshop:CaptionWriter>MetaGen</photoshop:CaptionWriter>
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${new Date().toISOString()}</xmp:ModifyDate>
      <Iptc4xmpCore:IntellectualGenre>Stock Photography</Iptc4xmpCore:IntellectualGenre>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const xmpNamespace = "http://ns.adobe.com/xap/1.0/\0";
  const xmpNamespaceBytes = new TextEncoder().encode(xmpNamespace);
  const xmpContentBytes = new TextEncoder().encode(xmpContent);

  const app1Length = 2 + xmpNamespaceBytes.length + xmpContentBytes.length;

  if (app1Length > 65533) {
    console.log("XMP segment too large");
    return new Uint8Array(0);
  }

  const app1Segment = new Uint8Array(2 + app1Length);
  app1Segment[0] = 0xff;
  app1Segment[1] = 0xe1;
  app1Segment[2] = (app1Length >> 8) & 0xff;
  app1Segment[3] = app1Length & 0xff;
  app1Segment.set(xmpNamespaceBytes, 4);
  app1Segment.set(xmpContentBytes, 4 + xmpNamespaceBytes.length);

  return app1Segment;
}

/**
 * Embed both EXIF and XMP metadata into JPEG
 * EXIF = Windows File Properties compatibility
 * XMP = Stock marketplace compatibility
 */
function embedMetadataIntoJpeg(
  jpegBuffer: Uint8Array,
  metadata: ImageMetadata
): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    console.log("No metadata to embed, returning original");
    return jpegBuffer;
  }

  // Validate JPEG
  if (jpegBuffer[0] !== 0xff || jpegBuffer[1] !== 0xd8) {
    console.log("Not a valid JPEG, returning original");
    return jpegBuffer;
  }

  // Build EXIF segment (for Windows Properties)
  const exifSegment = buildExifSegment(metadata);
  console.log("Built EXIF segment:", exifSegment.length, "bytes");

  // Build XMP segment (for stock marketplaces)
  const xmpSegment = buildXMPSegment(metadata);
  console.log("Built XMP segment:", xmpSegment.length, "bytes");

  // Create new image with both segments after SOI
  const totalLength = jpegBuffer.length + exifSegment.length + xmpSegment.length;
  const result = new Uint8Array(totalLength);

  let pos = 0;

  // SOI marker
  result.set(jpegBuffer.subarray(0, 2), pos);
  pos += 2;

  // EXIF APP1 segment (must come first for best compatibility)
  result.set(exifSegment, pos);
  pos += exifSegment.length;

  // XMP APP1 segment
  result.set(xmpSegment, pos);
  pos += xmpSegment.length;

  // Rest of original image
  result.set(jpegBuffer.subarray(2), pos);

  console.log("Successfully embedded EXIF + XMP metadata, new size:", result.length);
  return result;
}

/**
 * Build PNG iTXt chunk with XMP metadata
 * PNG supports XMP via iTXt (international text) chunks
 */
function buildPngXmpChunk(metadata: ImageMetadata): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    return new Uint8Array(0);
  }

  const safeTitle = escapeXml(metadata.title || "");
  const safeDescription = escapeXml(metadata.description || "");
  const keywordItems = metadata.keywords
    .filter((k) => k && k.trim())
    .map((k) => `          <rdf:li>${escapeXml(k)}</rdf:li>`)
    .join("\n");

  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeTitle}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeDescription}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
${keywordItems}
        </rdf:Bag>
      </dc:subject>
      <photoshop:Headline>${safeTitle}</photoshop:Headline>
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <Iptc4xmpCore:IntellectualGenre>Stock Photography</Iptc4xmpCore:IntellectualGenre>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  // PNG iTXt chunk structure for XMP:
  // Keyword: "XML:com.adobe.xmp" (null terminated)
  // Compression flag: 0 (no compression)
  // Compression method: 0
  // Language tag: empty (null terminated)
  // Translated keyword: empty (null terminated)
  // Text: XMP content

  const keyword = "XML:com.adobe.xmp";
  const keywordBytes = new TextEncoder().encode(keyword);
  const xmpBytes = new TextEncoder().encode(xmpContent);

  // Calculate chunk data size
  const dataSize = keywordBytes.length + 1 + 1 + 1 + 1 + 1 + xmpBytes.length;
  // keyword + null + compression flag + compression method + lang null + translated null + xmp

  const chunkData = new Uint8Array(dataSize);
  let pos = 0;

  // Keyword
  chunkData.set(keywordBytes, pos);
  pos += keywordBytes.length;
  chunkData[pos++] = 0; // null terminator

  // Compression flag (0 = uncompressed)
  chunkData[pos++] = 0;

  // Compression method (0)
  chunkData[pos++] = 0;

  // Language tag (empty, null terminated)
  chunkData[pos++] = 0;

  // Translated keyword (empty, null terminated)
  chunkData[pos++] = 0;

  // XMP content
  chunkData.set(xmpBytes, pos);

  return chunkData;
}

/**
 * Calculate CRC32 for PNG chunk
 */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);

  // Generate CRC table
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  // Calculate CRC
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Embed XMP metadata into PNG using iTXt chunk
 */
function embedMetadataIntoPng(
  pngBuffer: Uint8Array,
  metadata: ImageMetadata
): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    console.log("No metadata to embed in PNG, returning original");
    return pngBuffer;
  }

  // Validate PNG signature
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (pngBuffer[i] !== pngSignature[i]) {
      console.log("Not a valid PNG, returning original");
      return pngBuffer;
    }
  }

  // Build iTXt chunk data
  const chunkData = buildPngXmpChunk(metadata);
  if (chunkData.length === 0) {
    return pngBuffer;
  }

  // Build complete iTXt chunk
  const chunkType = new TextEncoder().encode("iTXt");
  const chunkLength = chunkData.length;

  // Create buffer for length(4) + type(4) + data + crc(4)
  const fullChunk = new Uint8Array(4 + 4 + chunkLength + 4);

  // Length (big-endian)
  fullChunk[0] = (chunkLength >> 24) & 0xff;
  fullChunk[1] = (chunkLength >> 16) & 0xff;
  fullChunk[2] = (chunkLength >> 8) & 0xff;
  fullChunk[3] = chunkLength & 0xff;

  // Type
  fullChunk.set(chunkType, 4);

  // Data
  fullChunk.set(chunkData, 8);

  // CRC (over type + data)
  const crcData = new Uint8Array(4 + chunkLength);
  crcData.set(chunkType, 0);
  crcData.set(chunkData, 4);
  const crc = crc32(crcData);
  fullChunk[8 + chunkLength] = (crc >> 24) & 0xff;
  fullChunk[8 + chunkLength + 1] = (crc >> 16) & 0xff;
  fullChunk[8 + chunkLength + 2] = (crc >> 8) & 0xff;
  fullChunk[8 + chunkLength + 3] = crc & 0xff;

  console.log("Built PNG iTXt chunk:", fullChunk.length, "bytes");

  // Find position after IHDR chunk to insert iTXt
  // PNG structure: signature (8) + chunks
  // Each chunk: length(4) + type(4) + data(length) + crc(4)
  let insertPos = 8; // After signature

  // Read first chunk (should be IHDR)
  const firstChunkLen =
    (pngBuffer[8] << 24) |
    (pngBuffer[9] << 16) |
    (pngBuffer[10] << 8) |
    pngBuffer[11];
  insertPos += 4 + 4 + firstChunkLen + 4; // Skip IHDR chunk

  // Create new PNG with iTXt chunk inserted after IHDR
  const result = new Uint8Array(pngBuffer.length + fullChunk.length);
  result.set(pngBuffer.subarray(0, insertPos), 0);
  result.set(fullChunk, insertPos);
  result.set(pngBuffer.subarray(insertPos), insertPos + fullChunk.length);

  console.log("Successfully embedded XMP into PNG, new size:", result.length);
  return result;
}

/**
 * Build XMP content for WebP (reusable for RIFF container)
 */
function buildWebpXmpContent(metadata: ImageMetadata): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    return new Uint8Array(0);
  }

  const safeTitle = escapeXml(metadata.title || "");
  const safeDescription = escapeXml(metadata.description || "");
  const keywordItems = metadata.keywords
    .filter((k) => k && k.trim())
    .map((k) => `          <rdf:li>${escapeXml(k)}</rdf:li>`)
    .join("\n");

  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeTitle}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${safeDescription}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
${keywordItems}
        </rdf:Bag>
      </dc:subject>
      <photoshop:Headline>${safeTitle}</photoshop:Headline>
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
      <xmp:CreateDate>${new Date().toISOString()}</xmp:CreateDate>
      <Iptc4xmpCore:IntellectualGenre>Stock Photography</Iptc4xmpCore:IntellectualGenre>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  return new TextEncoder().encode(xmpContent);
}

/**
 * Embed XMP metadata into WebP using RIFF XMP chunk
 * WebP uses RIFF container format with "XMP " chunk for XMP metadata
 */
function embedMetadataIntoWebp(
  webpBuffer: Uint8Array,
  metadata: ImageMetadata
): Uint8Array {
  const hasTitle = metadata.title && metadata.title.trim().length > 0;
  const hasDescription = metadata.description && metadata.description.trim().length > 0;
  const hasKeywords = metadata.keywords && metadata.keywords.length > 0;

  if (!hasTitle && !hasDescription && !hasKeywords) {
    console.log("No metadata to embed in WebP, returning original");
    return webpBuffer;
  }

  // Validate RIFF/WEBP signature
  // RIFF header: "RIFF" (4 bytes) + file size (4 bytes) + "WEBP" (4 bytes)
  const riffSignature = new TextDecoder().decode(webpBuffer.subarray(0, 4));
  const webpSignature = new TextDecoder().decode(webpBuffer.subarray(8, 12));
  
  if (riffSignature !== "RIFF" || webpSignature !== "WEBP") {
    console.log("Not a valid WebP file, returning original");
    return webpBuffer;
  }

  // Build XMP content
  const xmpBytes = buildWebpXmpContent(metadata);
  if (xmpBytes.length === 0) {
    return webpBuffer;
  }

  // Build XMP chunk for RIFF container
  // Chunk format: "XMP " (4 bytes) + chunk size (4 bytes, little-endian) + data
  const chunkId = new TextEncoder().encode("XMP ");
  const chunkSize = xmpBytes.length;
  
  // RIFF chunks must be word-aligned (even size), add padding byte if needed
  const paddingNeeded = chunkSize % 2 !== 0;
  const totalChunkSize = 4 + 4 + chunkSize + (paddingNeeded ? 1 : 0);

  const xmpChunk = new Uint8Array(totalChunkSize);
  let pos = 0;

  // Chunk ID: "XMP "
  xmpChunk.set(chunkId, pos);
  pos += 4;

  // Chunk size (little-endian)
  xmpChunk[pos++] = chunkSize & 0xff;
  xmpChunk[pos++] = (chunkSize >> 8) & 0xff;
  xmpChunk[pos++] = (chunkSize >> 16) & 0xff;
  xmpChunk[pos++] = (chunkSize >> 24) & 0xff;

  // XMP data
  xmpChunk.set(xmpBytes, pos);
  pos += xmpBytes.length;

  // Padding byte if needed
  if (paddingNeeded) {
    xmpChunk[pos] = 0;
  }

  console.log("Built WebP XMP chunk:", xmpChunk.length, "bytes");

  // Calculate new file size
  const originalFileSize = webpBuffer.length;
  const newFileSize = originalFileSize + xmpChunk.length;

  // Create new WebP with XMP chunk appended before the end
  // Insert after the initial WEBP chunks (we'll append at the end of RIFF container)
  const result = new Uint8Array(newFileSize);
  
  // Copy original WebP data
  result.set(webpBuffer, 0);
  
  // Append XMP chunk at the end
  result.set(xmpChunk, originalFileSize);

  // Update RIFF file size (bytes 4-7, little-endian)
  // RIFF size = total file size - 8 (excludes "RIFF" and size field itself)
  const riffSize = newFileSize - 8;
  result[4] = riffSize & 0xff;
  result[5] = (riffSize >> 8) & 0xff;
  result[6] = (riffSize >> 16) & 0xff;
  result[7] = (riffSize >> 24) & 0xff;

  console.log("Successfully embedded XMP into WebP, new size:", result.length);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("imageUrl");
    const filename = url.searchParams.get("filename") || "download.jpg";
    const title = url.searchParams.get("title") || "";
    const description = url.searchParams.get("description") || "";
    const keywords = url.searchParams.get("keywords") || "";
    const format = url.searchParams.get("format") || "image";

    console.log("Download request:", { imageUrl, filename, title, description, keywords, format });

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing imageUrl parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata: ImageMetadata = {
      title,
      description,
      keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(k => k) : [],
    };

    // If requesting XMP sidecar file
    if (format === "xmp") {
      const xmpContent = generateXMPContent(metadata);
      const xmpFilename = filename.replace(/\.[^.]+$/, ".xmp");

      return new Response(xmpContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/rdf+xml",
          "Content-Disposition": `attachment; filename="${xmpFilename}"`,
        },
      });
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch image:", imageResponse.status);
      return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    const isJpeg =
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      filename.toLowerCase().endsWith(".jpg") ||
      filename.toLowerCase().endsWith(".jpeg");
    
    const isPng =
      contentType.includes("png") ||
      filename.toLowerCase().endsWith(".png");
    
    const isWebp =
      contentType.includes("webp") ||
      filename.toLowerCase().endsWith(".webp");

    let responseBody: ArrayBuffer = arrayBuffer;
    let responseContentType = contentType;

    // Embed metadata based on format
    if (title || description || keywords) {
      if (isJpeg) {
        console.log("Embedding EXIF + XMP metadata into JPEG");
        const imageBuffer = new Uint8Array(arrayBuffer);
        const processedBuffer = embedMetadataIntoJpeg(imageBuffer, metadata);
        responseBody = processedBuffer.buffer as ArrayBuffer;
        responseContentType = "image/jpeg";
      } else if (isPng) {
        console.log("Embedding XMP metadata into PNG");
        const imageBuffer = new Uint8Array(arrayBuffer);
        const processedBuffer = embedMetadataIntoPng(imageBuffer, metadata);
        responseBody = processedBuffer.buffer as ArrayBuffer;
        responseContentType = "image/png";
      } else if (isWebp) {
        console.log("Embedding XMP metadata into WebP");
        const imageBuffer = new Uint8Array(arrayBuffer);
        const processedBuffer = embedMetadataIntoWebp(imageBuffer, metadata);
        responseBody = processedBuffer.buffer as ArrayBuffer;
        responseContentType = "image/webp";
      }
      console.log("Original size:", arrayBuffer.byteLength, "New size:", responseBody.byteLength);
    }

    console.log("Returning image for download:", filename, "size:", responseBody.byteLength);

    const safeFilename = encodeURIComponent(filename).replace(/'/g, "%27");

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": responseContentType,
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${safeFilename}`,
        "Content-Length": responseBody.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new Response(JSON.stringify({ error: "Download failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
