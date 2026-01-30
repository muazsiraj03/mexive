import { Check, Wand2, MessageSquareText, Eraser, FileCheck } from "lucide-react";

const tools = [
  {
    name: "Metadata Generator",
    description: "Titles, descriptions & 50 keywords for 3 marketplaces",
    icon: Wand2,
    status: "Ready to download",
    color: "text-primary",
  },
  {
    name: "Image to Prompt",
    description: "Midjourney, DALL-E & Stable Diffusion prompts extracted",
    icon: MessageSquareText,
    status: "3 variations generated",
    color: "text-secondary",
  },
  {
    name: "Background Remover",
    description: "Transparent PNG ready for download",
    icon: Eraser,
    status: "Processing complete",
    color: "text-accent-foreground",
  },
  {
    name: "File Reviewer",
    description: "Quality score: 94/100 — Ready to upload",
    icon: FileCheck,
    status: "Passed all checks",
    color: "text-success",
  },
];

export function DashboardMockup() {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent rounded-2xl blur-2xl -z-10" />
      
      <div className="bg-card rounded-2xl border border-border/60 card-elevated-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-success/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 bg-muted rounded-md text-xs text-muted-foreground">
              metagen.lovable.app/dashboard
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.name} {...tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolCardProps {
  name: string;
  description: string;
  icon: React.ElementType;
  status: string;
  color: string;
}

function ToolCard({ name, description, icon: Icon, status, color }: ToolCardProps) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border/50 transition-smooth-300 hover:border-secondary/20 group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-smooth">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <div className="flex items-center gap-1 text-success">
              <Check className="w-3 h-3" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{description}</p>
          <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}