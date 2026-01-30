import { useState } from "react";
import { Copy, Check, Edit2, X, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MetadataCardProps {
  marketplace: string;
  title: string;
  description?: string;
  keywords: string[];
  color: string;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onKeywordsChange?: (keywords: string[]) => void;
  onDownload?: () => void;
  showDownload?: boolean;
}

export function MetadataCard({
  marketplace,
  title,
  description = "",
  keywords,
  color,
  onTitleChange,
  onDescriptionChange,
  onKeywordsChange,
  onDownload,
  showDownload = false,
}: MetadataCardProps) {
  const [copied, setCopied] = useState<"title" | "description" | "keywords" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editKeywords, setEditKeywords] = useState(keywords.join(", "));

  const copyToClipboard = async (text: string, type: "title" | "description" | "keywords") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = () => {
    onTitleChange?.(editTitle);
    onDescriptionChange?.(editDescription);
    onKeywordsChange?.(editKeywords.split(",").map((k) => k.trim()).filter(Boolean));
    setIsEditing(false);
    toast.success("Metadata updated!");
  };

  const handleCancel = () => {
    setEditTitle(title);
    setEditDescription(description);
    setEditKeywords(keywords.join(", "));
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated transition-all hover:border-secondary/20 hover:card-elevated-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              color
            )}
          >
            <span className="text-lg font-bold text-white">
              {marketplace[0]}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{marketplace}</h4>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Ready
            </span>
          </div>
        </div>
        {isEditing ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Save className="h-4 w-4 text-secondary" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Title */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Title
            <span className="ml-2 normal-case text-muted-foreground/70">
              ({isEditing ? editTitle.length : title.length}/200)
            </span>
          </p>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => copyToClipboard(title, "title")}
            >
              {copied === "title" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, 200))}
            className="mt-1"
            maxLength={200}
          />
        ) : (
          <p className="mt-1 text-sm text-foreground">{title}</p>
        )}
      </div>

      {/* Description */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Description
            <span className="ml-2 normal-case text-muted-foreground/70">
              ({isEditing ? editDescription.length : (description?.length || 0)}/500)
            </span>
          </p>
          {!isEditing && description && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => copyToClipboard(description, "description")}
            >
              {copied === "description" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {isEditing ? (
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value.slice(0, 500))}
            className="mt-1 min-h-[80px] resize-none"
            maxLength={500}
            placeholder="Description of the image..."
          />
        ) : (
          <p className="mt-1 text-sm text-foreground line-clamp-3">
            {description || <span className="text-muted-foreground italic">No description</span>}
          </p>
        )}
      </div>

      {/* Keywords */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Keywords ({keywords.length})
          </p>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => copyToClipboard(keywords.join(", "), "keywords")}
            >
              {copied === "keywords" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {isEditing ? (
          <Textarea
            value={editKeywords}
            onChange={(e) => setEditKeywords(e.target.value)}
            className="mt-1 min-h-[80px] resize-none"
            placeholder="keyword1, keyword2, keyword3..."
          />
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="group/keyword inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => {
                    const newKeywords = keywords.filter((_, i) => i !== index);
                    onKeywordsChange?.(newKeywords);
                  }}
                  className="ml-0.5 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Download Button */}
      {showDownload && onDownload && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-full"
            onClick={onDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download for {marketplace}
          </Button>
        </div>
      )}
    </div>
  );
}
