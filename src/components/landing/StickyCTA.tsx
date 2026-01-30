import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (approximately 600px)
      const shouldShow = window.scrollY > 600;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-4 animate-fade-in">
      <div className="container flex items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="font-medium text-foreground">Ready to save hours on metadata?</p>
          <p className="text-sm text-muted-foreground">Start your free trial today.</p>
        </div>

        <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
          <Button size="default" className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-6 font-medium btn-hover-lift flex-1 sm:flex-initial">
            Try Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
