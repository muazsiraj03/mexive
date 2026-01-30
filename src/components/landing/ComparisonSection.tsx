import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const comparisons = [
  {
    aspect: "Time per 10 images",
    manual: "30–60 minutes",
    ai: "Under 2 minutes",
  },
  {
    aspect: "Keyword research",
    manual: "Manual search & guesswork",
    ai: "AI-optimized suggestions",
  },
  {
    aspect: "Error rate",
    manual: "High (typos, wrong tags)",
    ai: "Near zero",
  },
  {
    aspect: "Marketplace compliance",
    manual: "Often inconsistent",
    ai: "Always formatted correctly",
  },
  {
    aspect: "Acceptance likelihood",
    manual: "Variable",
    ai: "Significantly higher",
  },
  {
    aspect: "Consistency",
    manual: "Depends on your focus",
    ai: "100% consistent quality",
  },
];

export function ComparisonSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Manual vs AI-Powered
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how much time and effort you can save with automated metadata generation
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/60 overflow-hidden card-elevated-lg">
            <div className="grid grid-cols-3 bg-muted/30 border-b border-border/60">
              <div className="p-5 font-medium text-muted-foreground">Aspect</div>
              <div className="p-5 font-medium text-center text-destructive">Manual Workflow</div>
              <div className="p-5 font-medium text-center text-secondary">AI Stock Metadata</div>
            </div>
            {comparisons.map((row, index) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-3 transition-smooth hover:bg-muted/20 ${index !== comparisons.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="p-5 font-medium text-foreground">{row.aspect}</div>
                <div className="p-5 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <X className="w-4 h-4 text-destructive/60 flex-shrink-0" />
                  <span>{row.manual}</span>
                </div>
                <div className="p-5 text-center text-foreground flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="font-medium">{row.ai}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {comparisons.map((row) => (
              <div key={row.aspect} className="bg-card rounded-2xl border border-border/60 p-5 card-elevated">
                <h4 className="font-medium text-foreground mb-3">{row.aspect}</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <X className="w-4 h-4 text-destructive/60 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{row.manual}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{row.ai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 font-medium h-12 text-base btn-hover-lift" asChild>
              <a href="#pricing">
                Start Saving Time
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
