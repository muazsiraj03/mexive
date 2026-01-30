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
 * Embed XMP metadata into JPEG using APP1 marker
 */
function embedXMPIntoJpeg(
  jpegBuffer: Uint8Array<ArrayBuffer>,
  metadata: ImageMetadata
): Uint8Array<ArrayBuffer> {
  const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetaGen by Lovable">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(metadata.title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(metadata.description)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
${metadata.keywords.map((k) => `          <rdf:li>${escapeXml(k)}</rdf:li>`).join("\n")}
        </rdf:Bag>
      </dc:subject>
      <photoshop:Headline>${escapeXml(metadata.title)}</photoshop:Headline>
      <xmp:CreatorTool>MetaGen by Lovable</xmp:CreatorTool>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const xmpNamespace = "http://ns.adobe.com/xap/1.0/\0";
  const xmpNamespaceBytes = new TextEncoder().encode(xmpNamespace);
  const xmpContentBytes = new TextEncoder().encode(xmpContent);

  // APP1 marker (0xFFE1) + length (2 bytes) + namespace + content
  const app1Length = 2 + xmpNamespaceBytes.length + xmpContentBytes.length;
  const app1Segment = new Uint8Array(2 + app1Length);
  app1Segment[0] = 0xff;
  app1Segment[1] = 0xe1;
  app1Segment[2] = (app1Length >> 8) & 0xff;
  app1Segment[3] = app1Length & 0xff;
  app1Segment.set(xmpNamespaceBytes, 4);
  app1Segment.set(xmpContentBytes, 4 + xmpNamespaceBytes.length);

  // Find position after SOI marker (0xFFD8)
  if (jpegBuffer[0] !== 0xff || jpegBuffer[1] !== 0xd8) {
    console.log("Not a valid JPEG, returning original");
    return jpegBuffer;
  }

  // Insert APP1 segment after SOI
  const result = new Uint8Array(jpegBuffer.length + app1Segment.length);
  result.set(jpegBuffer.subarray(0, 2), 0); // SOI
  result.set(app1Segment, 2); // New APP1
  result.set(jpegBuffer.subarray(2), 2 + app1Segment.length); // Rest of image

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
    const format = url.searchParams.get("format") || "image"; // "image" or "xmp"

    console.log("Download request:", { imageUrl, filename, title, format });

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing imageUrl parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata: ImageMetadata = {
      title,
      description,
      keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
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
    const isJpeg = contentType.includes("jpeg") || contentType.includes("jpg") || 
                   filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg");

    let responseBody: ArrayBuffer = arrayBuffer;

    // Embed metadata if JPEG and metadata provided
    if (isJpeg && (title || description || keywords)) {
      console.log("Embedding XMP metadata into JPEG");
      const imageBuffer = new Uint8Array(arrayBuffer);
      const processedBuffer = embedXMPIntoJpeg(imageBuffer as Uint8Array<ArrayBuffer>, metadata);
      responseBody = processedBuffer.buffer as ArrayBuffer;
    }

    console.log("Returning image for download:", filename, "size:", responseBody.byteLength);

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": isJpeg ? "image/jpeg" : contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": responseBody.byteLength.toString(),
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
