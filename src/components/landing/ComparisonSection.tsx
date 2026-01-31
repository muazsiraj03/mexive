import { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComparisons } from "@/hooks/use-comparisons";
import { Link } from "react-router-dom";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

function ComparisonSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="hidden md:block bg-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-3 bg-muted/30 border-b border-border/60">
          <Skeleton className="h-6 w-20 m-5" />
          <Skeleton className="h-6 w-32 m-5 mx-auto" />
          <Skeleton className="h-6 w-32 m-5 mx-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 border-b border-border/40 last:border-0">
            <Skeleton className="h-5 w-32 m-5" />
            <Skeleton className="h-5 w-28 m-5 mx-auto" />
            <Skeleton className="h-5 w-28 m-5 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonSection() {
  const { comparisons, isLoading, getComparisonsByTool } = useComparisons();
  const [activeTab, setActiveTab] = useState("metadata-generator");

  const currentComparisons = getComparisonsByTool(activeTab);

  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Manual vs AI-Powered
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            See how much time and effort you can save with automated metadata generation
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-lg">
              {TOOLS.map((tool) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className="px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
                >
                  {tool.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <ComparisonSkeleton />
        ) : currentComparisons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No comparison data available for this tool.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Desktop table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/60 overflow-hidden card-elevated-lg">
              <div className="grid grid-cols-3 bg-muted/30 border-b border-border/60">
                <div className="p-5 font-medium text-muted-foreground">Aspect</div>
                <div className="p-5 font-medium text-center text-destructive">Manual Workflow</div>
                <div className="p-5 font-medium text-center text-secondary">AI Stock Metadata</div>
              </div>
              {currentComparisons.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-3 transition-smooth hover:bg-muted/20 ${index !== currentComparisons.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <div className="p-5 font-medium text-foreground">{row.aspect}</div>
                  <div className="p-5 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <X className="w-4 h-4 text-destructive/60 flex-shrink-0" />
                    <span>{row.manual_value}</span>
                  </div>
                  <div className="p-5 text-center text-foreground flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="font-medium">{row.ai_value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {currentComparisons.map((row) => (
                <div key={row.id} className="bg-card rounded-2xl border border-border/60 p-5 card-elevated">
                  <h4 className="font-medium text-foreground mb-3">{row.aspect}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-destructive/60 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{row.manual_value}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium">{row.ai_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 font-medium h-12 text-base btn-hover-lift" asChild>
                <Link to="/auth">
                  Start Saving Time
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
