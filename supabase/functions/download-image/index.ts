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

    let responseBody: ArrayBuffer = arrayBuffer;

    // Embed metadata if JPEG and metadata provided
    if (isJpeg && (title || description || keywords)) {
      console.log("Embedding EXIF + XMP metadata into JPEG");
      console.log("Metadata:", { title, description, keywordsCount: metadata.keywords.length });
      const imageBuffer = new Uint8Array(arrayBuffer);
      const processedBuffer = embedMetadataIntoJpeg(imageBuffer, metadata);
      responseBody = processedBuffer.buffer as ArrayBuffer;
      console.log("Original size:", arrayBuffer.byteLength, "New size:", responseBody.byteLength);
    }

    console.log("Returning image for download:", filename, "size:", responseBody.byteLength);

    const safeFilename = encodeURIComponent(filename).replace(/'/g, "%27");

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": isJpeg ? "image/jpeg" : contentType,
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
