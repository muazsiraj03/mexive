import { useState } from "react";
import { 
  Wand2, 
  MessageSquareText, 
  Eraser, 
  FileCheck,
  Check,
  Sparkles,
  Copy,
  Download,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "metadata",
    name: "Metadata Generator",
    icon: Wand2,
    tagline: "AI-Powered Metadata for Stock Photos",
    description: "Generate optimized titles, descriptions, and 50 keywords tailored for Adobe Stock, Shutterstock, and Freepik in seconds.",
    features: [
      "Marketplace-specific optimization",
      "Bulk processing with batch queue",
      "XMP metadata embedding",
      "SEO-friendly filenames",
    ],
    mockup: MetadataMockup,
  },
  {
    id: "prompt",
    name: "Image to Prompt",
    icon: MessageSquareText,
    tagline: "Extract AI Prompts from Any Image",
    description: "Reverse-engineer detailed prompts for Midjourney, DALL-E, and Stable Diffusion from any reference image.",
    features: [
      "Multiple detail levels (Basic to Expert)",
      "Prompt variations (Composition, Color, Mood)",
      "Batch processing queue",
      "Copy-ready prompts",
    ],
    mockup: PromptMockup,
  },
  {
    id: "background",
    name: "Background Remover",
    icon: Eraser,
    tagline: "Instant Background Removal",
    description: "Remove backgrounds with WebGPU-accelerated local processing. No credits consumed, works entirely in your browser.",
    features: [
      "100% local processing",
      "High-precision AI models",
      "Transparent PNG export",
      "Zero credit cost",
    ],
    mockup: BackgroundMockup,
  },
  {
    id: "reviewer",
    name: "File Reviewer",
    icon: FileCheck,
    tagline: "Pre-Upload Quality Control",
    description: "AI-powered analysis against marketplace rejection standards. Get a quality score and detailed feedback before uploading.",
    features: [
      "Pass/fail verdict with score",
      "Marketplace-specific notes",
      "Detailed improvement suggestions",
      "Supports images, vectors & video",
    ],
    mockup: ReviewerMockup,
  },
];

export function ToolsShowcaseSection() {
  const [activeToolId, setActiveToolId] = useState(tools[0].id);
  const activeTool = tools.find((t) => t.id === activeToolId)!;

  return (
    <section id="tools" className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">AI-Powered Tools</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need in One Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four powerful AI tools designed specifically for stock contributors
          </p>
        </div>

        {/* Tool Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-smooth-300",
                activeToolId === tool.id
                  ? "bg-secondary text-secondary-foreground shadow-md"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-secondary/30"
              )}
            >
              <tool.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.name}</span>
            </button>
          ))}
        </div>

        {/* Active Tool Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Info */}
            <div 
              key={`info-${activeTool.id}`}
              className="order-2 lg:order-1 animate-fade-in"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <activeTool.icon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{activeTool.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeTool.tagline}</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {activeTool.description}
              </p>

              <ul className="space-y-3 mb-8">
                {activeTool.features.map((feature, index) => (
                  <li 
                    key={feature} 
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 font-medium btn-hover-lift">
                Try {activeTool.name}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Right: Mockup */}
            <div 
              key={`mockup-${activeTool.id}`}
              className="order-1 lg:order-2 animate-scale-in"
            >
              <activeTool.mockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetadataMockup() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 card-elevated-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
          <Sparkles className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">3 marketplaces generated</span>
        </div>
        {["Adobe Stock", "Shutterstock", "Freepik"].map((mp, i) => (
          <div key={mp} className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{mp}</span>
              <Check className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {i === 0 && "Professional businessman working on laptop..."}
              {i === 1 && "Corporate employee at modern workplace..."}
              {i === 2 && "Creative professional in contemporary office..."}
            </p>
            <div className="flex gap-1">
              {["business", "office", "laptop"].map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-background rounded text-[10px] text-muted-foreground">
                  {kw}
                </span>
              ))}
              <span className="px-2 py-0.5 text-[10px] text-muted-foreground">+47</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptMockup() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 card-elevated-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          {["Midjourney", "DALL-E", "Stable Diffusion"].map((platform) => (
            <span key={platform} className="px-3 py-1 bg-secondary/10 rounded-full text-xs font-medium text-secondary">
              {platform}
            </span>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Generated Prompt</span>
            <button className="p-1.5 rounded-md hover:bg-muted transition-smooth">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A serene mountain landscape at golden hour, dramatic clouds, cinematic lighting, ultra detailed, 8k resolution, professional photography --ar 16:9 --v 6
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Composition", "Color", "Mood"].map((variant) => (
            <div key={variant} className="p-3 rounded-lg bg-muted/20 border border-border/40 text-center">
              <span className="text-[10px] font-medium text-muted-foreground">{variant}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BackgroundMockup() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 card-elevated-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Original</span>
            <div className="aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="w-16 h-20 bg-foreground/20 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Transparent</span>
            <div className="aspect-square rounded-xl bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZWIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] flex items-center justify-center">
              <div className="w-16 h-20 bg-foreground/40 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Background removed</span>
          </div>
          <button className="p-2 rounded-lg bg-success/20 hover:bg-success/30 transition-smooth">
            <Download className="w-4 h-4 text-success" />
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          ✨ Zero credits • 100% local processing
        </p>
      </div>
    </div>
  );
}

function ReviewerMockup() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 card-elevated-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">Quality Score</span>
          <span className="text-3xl font-bold text-success">94<span className="text-lg text-muted-foreground">/100</span></span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-[94%] bg-gradient-to-r from-success to-success/80 rounded-full" />
        </div>
        <div className="p-3 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Ready to upload</span>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Marketplace Notes</span>
          {["Adobe Stock: Meets technical requirements", "Shutterstock: Good composition", "Freepik: Commercial potential high"].map((note) => (
            <div key={note} className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-xs text-muted-foreground">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
