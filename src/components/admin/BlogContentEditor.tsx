import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Quote,
  Code,
  Minus,
} from "lucide-react";

interface BlogContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BlogContentEditor({ value, onChange }: BlogContentEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "Bold" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "Italic" },
    { icon: Heading1, action: () => insertAtLineStart("# "), title: "Heading 1" },
    { icon: Heading2, action: () => insertAtLineStart("## "), title: "Heading 2" },
    { icon: Heading3, action: () => insertAtLineStart("### "), title: "Heading 3" },
    { icon: List, action: () => insertAtLineStart("- "), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertAtLineStart("1. "), title: "Numbered List" },
    { icon: Quote, action: () => insertAtLineStart("> "), title: "Quote" },
    { icon: Code, action: () => insertMarkdown("`", "`"), title: "Inline Code" },
    { icon: Link, action: () => insertMarkdown("[", "](url)"), title: "Link" },
    { icon: Image, action: () => insertMarkdown("![alt](", ")"), title: "Image" },
    { icon: Minus, action: () => insertMarkdown("\n---\n"), title: "Horizontal Rule" },
  ];

  // Simple markdown to HTML preview
  const renderPreview = (content: string) => {
    let html = content
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers
      .replace(/^### (.*)$/gm, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2 class='text-xl font-semibold mt-6 mb-3'>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
      // Bold and Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre class='bg-muted p-4 rounded-lg my-4 overflow-x-auto'><code>$2</code></pre>")
      // Inline code
      .replace(/`(.+?)`/g, "<code class='bg-muted px-1 py-0.5 rounded text-sm'>$1</code>")
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<img src='$2' alt='$1' class='max-w-full rounded-lg my-4' />")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-primary hover:underline'>$1</a>")
      // Blockquotes
      .replace(/^&gt; (.*)$/gm, "<blockquote class='border-l-4 border-primary pl-4 italic my-4'>$1</blockquote>")
      // Horizontal rules
      .replace(/^---$/gm, "<hr class='my-8 border-border' />")
      // Lists
      .replace(/^- (.*)$/gm, "<li class='ml-4'>$1</li>")
      .replace(/^(\d+)\. (.*)$/gm, "<li class='ml-4'>$2</li>")
      // Paragraphs
      .replace(/\n\n/g, "</p><p class='mb-4'>")
      .replace(/\n/g, "<br />");

    return `<p class='mb-4'>${html}</p>`;
  };

  return (
    <div className="space-y-2">
      <Label>Content</Label>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
        <div className="flex items-center justify-between border rounded-t-lg bg-muted/50 p-1">
          <div className="flex flex-wrap gap-1">
            {toolbarButtons.map((btn, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={btn.action}
                title={btn.title}
              >
                <btn.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="write" className="text-xs h-7">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-7">Preview</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="write" className="mt-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your blog content here using Markdown..."
            className="min-h-[400px] rounded-t-none font-mono text-sm"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div
            className="min-h-[400px] border rounded-b-lg p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Supports Markdown formatting. Use the toolbar or type markdown directly.
      </p>
    </div>
  );
}
