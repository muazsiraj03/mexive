import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="section-padding bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-dot-pattern opacity-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary-foreground">Ready to get started?</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 text-balance">
            Start Free — No Credit Card Required
          </h2>

          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            Join thousands of stock contributors who are saving hours every week with AI-powered metadata generation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 font-medium h-12 text-base btn-hover-lift">
              Try Free Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-8 font-medium h-12 text-base"
            >
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
