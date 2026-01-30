import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { AnimatedToolDemo } from "./AnimatedToolDemo";

export function HeroSection() {
  return (
    <section className="relative hero-gradient pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-50" />
      
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-subtle" />
            <span className="text-sm font-medium text-secondary">AI-Powered Metadata Generation</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in-up text-balance">
            AI Tools for{" "}
            <span className="text-secondary">Stock Contributors</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Metadata generator, image-to-prompt & file reviewer — everything you need to upload faster.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 font-medium h-12 text-base btn-hover-lift">
              Try Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 font-medium h-12 text-base border-foreground/20 hover:bg-muted hover:border-foreground/40 hover:text-foreground btn-hover-lift" asChild>
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Free credits included</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Animated Tool Demo */}
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <AnimatedToolDemo />
        </div>
      </div>
    </section>
  );
}
