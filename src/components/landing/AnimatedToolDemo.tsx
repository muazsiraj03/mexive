import { useState, useEffect } from "react";
import { 
  Wand2, 
  MessageSquareText, 
  FileCheck,
  Check,
  Sparkles,
  Download,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const tools = [
  {
    id: "metadata",
    name: "Metadata Generator",
    icon: Wand2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "prompt",
    name: "Image to Prompt",
    icon: MessageSquareText,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "reviewer",
    name: "File Reviewer",
    icon: FileCheck,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

// Metadata Generator Demo
function MetadataDemo({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState(0);
  
  const keywords = [
    "mountain", "sunset", "landscape", "nature", "scenic",
    "orange sky", "wilderness", "travel", "adventure", "outdoors",
    "peaceful", "serene", "golden hour", "panoramic", "majestic"
  ];

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 16);
    }, 200);
    return () => clearInterval(timer);
  }, [isActive]);

  return (
    <div className="space-y-4">
      {/* Title being typed */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Title</span>
        <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
          <span className="text-sm text-foreground">
            {"Majestic Mountain Sunset Over Wilderness Valley".slice(0, Math.min(step * 3, 44))}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>

      {/* Keywords appearing */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Keywords ({Math.min(step, keywords.length)}/50)</span>
        <div className="flex flex-wrap gap-1.5">
          {keywords.slice(0, step).map((keyword, i) => (
            <span
              key={keyword}
              className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary animate-scale-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Image to Prompt Demo
function PromptDemo({ isActive }: { isActive: boolean }) {
  const [progress, setProgress] = useState(0);
  const prompt = "A breathtaking mountain landscape at golden hour, warm orange and pink sky reflecting off snow-capped peaks, dramatic lighting, ultra-detailed, 8K resolution, cinematic composition --ar 16:9 --v 6";
  
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 2, prompt.length));
    }, 30);
    return () => clearInterval(timer);
  }, [isActive]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
        <span className="text-xs text-muted-foreground">Analyzing image...</span>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-3 border border-border/50 min-h-[80px]">
        <p className="text-sm text-foreground leading-relaxed">
          {prompt.slice(0, progress)}
          <span className="animate-pulse text-secondary">|</span>
        </p>
      </div>
      
      <div className="flex gap-2">
        {["Midjourney", "DALL-E", "SD XL"].map((platform, i) => (
          <span 
            key={platform}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-all duration-300",
              progress > 50 * (i + 1) 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-muted text-muted-foreground border-border/50"
            )}
          >
            {progress > 50 * (i + 1) && <Check className="w-3 h-3 inline mr-1" />}
            {platform}
          </span>
        ))}
      </div>
    </div>
  );
}

// File Reviewer Demo
function ReviewerDemo({ isActive }: { isActive: boolean }) {
  const [checks, setChecks] = useState<number[]>([]);
  
  const criteria = [
    { name: "Resolution", score: 98 },
    { name: "Noise Level", score: 95 },
    { name: "Composition", score: 92 },
    { name: "Commercial Value", score: 94 },
  ];

  useEffect(() => {
    if (!isActive) {
      setChecks([]);
      return;
    }
    const timers = criteria.map((_, i) => 
      setTimeout(() => setChecks((c) => [...c, i]), (i + 1) * 600)
    );
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  const overallScore = checks.length > 0 
    ? Math.round(criteria.slice(0, checks.length).reduce((a, c) => a + c.score, 0) / checks.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Quality Analysis</span>
        <div className={cn(
          "text-lg font-bold transition-all duration-300",
          overallScore >= 90 ? "text-success" : overallScore >= 70 ? "text-warning" : "text-muted-foreground"
        )}>
          {overallScore > 0 ? `${overallScore}/100` : "—"}
        </div>
      </div>
      
      <div className="space-y-2">
        {criteria.map((criterion, i) => (
          <div 
            key={criterion.name}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
              checks.includes(i) ? "bg-success/5" : "bg-muted/30"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
              checks.includes(i) ? "bg-success text-success-foreground" : "bg-muted"
            )}>
              {checks.includes(i) && <Check className="w-3 h-3" />}
            </div>
            <span className="text-xs flex-1">{criterion.name}</span>
            <span className={cn(
              "text-xs font-medium transition-all duration-300",
              checks.includes(i) ? "text-success" : "text-muted-foreground"
            )}>
              {checks.includes(i) ? criterion.score : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnimatedToolDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-cycle through tools
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % tools.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeTool = tools[activeIndex];

  const renderDemo = () => {
    switch (activeTool.id) {
      case "metadata":
        return <MetadataDemo isActive={true} />;
      case "prompt":
        return <PromptDemo isActive={true} />;
      case "reviewer":
        return <ReviewerDemo isActive={true} />;
      default:
        return null;
    }
  };

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
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Tool selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">mountain-sunset.jpg</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Uploaded</span>
              </div>
              
              {tools.map((tool, index) => {
                const Icon = tool.icon;
                const isActive = index === activeIndex;
                
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveIndex(index);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left",
                      isActive 
                        ? "border-secondary/40 bg-secondary/5 shadow-sm" 
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                      isActive ? "bg-secondary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-5 h-5", isActive ? tool.color : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm font-medium block transition-colors duration-300",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {tool.name}
                      </span>
                      {isActive && (
                        <span className="text-xs text-secondary animate-fade-in">Processing...</span>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Live demo */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 min-h-[280px]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
                <activeTool.icon className={cn("w-4 h-4", activeTool.color)} />
                <span className="text-sm font-medium">{activeTool.name}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary animate-pulse">
                  Live
                </span>
              </div>
              
              <div key={activeTool.id} className="animate-fade-in">
                {renderDemo()}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
            <div className="flex items-center gap-4">
              {tools.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIndex(i);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i === activeIndex ? "bg-secondary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors">
              <Download className="w-4 h-4" />
              Download Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
