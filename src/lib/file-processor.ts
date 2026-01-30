/**
 * Utility functions to convert vectors and videos to images for AI analysis
 */

/**
 * Extract a frame from a video file at a specific time
 */
export async function extractVideoFrame(file: File, timeSeconds = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
      canvas.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to the specified time or 10% into the video if it's shorter
      video.currentTime = Math.min(timeSeconds, video.duration * 0.1);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (!ctx) {
        cleanup();
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          cleanup();
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not extract video frame"));
          }
        },
        "image/jpeg",
        0.9
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video file"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Convert an SVG file to PNG
 */
export async function convertSvgToPng(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const svgContent = reader.result as string;
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // Use a reasonable size if SVG doesn't specify dimensions
        const width = img.width || 1024;
        const height = img.height || 1024;

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // White background for SVGs with transparency
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Could not convert SVG to PNG"));
            }
          },
          "image/png",
          1.0
        );
      };

      img.onerror = () => {
        reject(new Error("Could not load SVG file"));
      };

      // Convert SVG to data URL for loading
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      img.src = URL.createObjectURL(svgBlob);
    };

    reader.onerror = () => {
      reject(new Error("Could not read SVG file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Process a file for AI analysis - converts videos/vectors to images
 * Returns the original file if it's already an analyzable image
 */
export async function processFileForAnalysis(
  file: File
): Promise<{ blob: Blob; wasConverted: boolean; originalType: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const analyzableTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  // Already analyzable - return as-is
  if (analyzableTypes.includes(file.type)) {
    return { blob: file, wasConverted: false, originalType: file.type };
  }

  // SVG conversion
  if (file.type === "image/svg+xml" || extension === "svg") {
    const pngBlob = await convertSvgToPng(file);
    return { blob: pngBlob, wasConverted: true, originalType: "svg" };
  }

  // Video frame extraction
  const videoExtensions = ["mp4", "webm", "mov", "avi", "wmv"];
  if (file.type.startsWith("video/") || (extension && videoExtensions.includes(extension))) {
    const frameBlob = await extractVideoFrame(file);
    return { blob: frameBlob, wasConverted: true, originalType: "video" };
  }

  // EPS/AI files - these cannot be easily converted in browser
  const vectorExtensions = ["eps", "ai"];
  if (extension && vectorExtensions.includes(extension)) {
    throw new Error(
      `${extension.toUpperCase()} files cannot be analyzed directly. Please convert to PNG/JPG first.`
    );
  }

  // Unknown type - try to use as-is
  return { blob: file, wasConverted: false, originalType: file.type };
}
