import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle, FileVideo, FileImage, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video" | "vector";
}

interface ImageUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

// Image types
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Vector types
const VECTOR_TYPES = ["image/svg+xml", "application/postscript", "application/eps", "application/x-eps", "image/x-eps"];
// Video types  
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv"];

const ACCEPTED_TYPES = [...IMAGE_TYPES, ...VECTOR_TYPES, ...VIDEO_TYPES];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.svg,.eps,.ai,.mp4,.webm,.mov,.avi,.wmv";

const getFileType = (file: File): "image" | "video" | "vector" => {
  if (VIDEO_TYPES.includes(file.type) || file.name.match(/\.(mp4|webm|mov|avi|wmv)$/i)) return "video";
  if (VECTOR_TYPES.includes(file.type) || file.name.match(/\.(svg|eps|ai)$/i)) return "vector";
  return "image";
};

export function ImageUploader({
  files,
  onFilesChange,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check by extension for vector files that may not have correct MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'eps', 'ai', 'mp4', 'webm', 'mov', 'avi', 'wmv'];
    
    const isValidType = ACCEPTED_TYPES.includes(file.type) || (extension && validExtensions.includes(extension));
    
    if (!isValidType) {
      return `${file.name} is not supported. Use JPG, PNG, WEBP, SVG, EPS, or video files.`;
    }
    return null;
  };

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {

        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
          return;
        }

        const fileType = getFileType(file);
        // For vectors/videos without preview support, use placeholder
        const canPreview = fileType === "image" || file.type === "image/svg+xml";
        
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: canPreview ? URL.createObjectURL(file) : "",
          type: fileType,
        });
      });

      if (errors.length > 0) {
        setError(errors[0]);
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const handleFolderSelect = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
        {...{ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
      />

      {/* Upload Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 rounded-xl"
          onClick={handleFileSelect}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 rounded-xl"
          onClick={handleFolderSelect}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Upload Folder
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all",
          isDragging
            ? "border-secondary bg-secondary/5"
            : "border-border/60 bg-muted/30 hover:border-secondary/50 hover:bg-muted/50"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
          <Upload className="h-6 w-6 text-secondary" />
        </div>
        <p className="mt-3 text-center text-sm font-medium text-foreground">
          Or drag and drop files here
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          JPG, PNG, WEBP, SVG, EPS, AI, MP4, MOV, WEBM
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="aspect-video bg-muted/30 flex items-center justify-center">
                {file.type === "image" || file.file.type === "image/svg+xml" ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : file.type === "video" ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileVideo className="h-10 w-10" />
                    <span className="text-xs uppercase">{file.file.name.split('.').pop()}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileImage className="h-10 w-10" />
                    <span className="text-xs uppercase">{file.file.name.split('.').pop()}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-muted/20 p-6 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No images uploaded yet
          </p>
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
