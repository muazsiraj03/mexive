import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFAQs } from "@/hooks/use-faqs";
import { HelpCircle, MessageCircleQuestion, Sparkles } from "lucide-react";

function FAQSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/60 px-6 py-5">
          <Skeleton className="h-5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function FAQVisual() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full">
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute -inset-8 bg-gradient-to-br from-secondary/10 via-primary/5 to-transparent rounded-3xl blur-2xl" />
        
        <div className="relative bg-card rounded-2xl border border-border/60 p-8 card-elevated">
          {/* Main icon */}
          <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 mx-auto">
            <MessageCircleQuestion className="w-10 h-10 text-secondary" />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground text-center mb-2">
            Have Questions?
          </h3>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Find answers to common questions about our AI-powered tools
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm text-foreground">Instant answers</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Clear explanations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const { faqs, isLoading } = useFAQs();

  // Filter to only show active FAQs
  const activeFAQs = faqs.filter((f) => f.is_active);

  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about AI Stock Metadata Generator
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Visual (desktop only) */}
            <FAQVisual />

            {/* Right: FAQ Content */}
            <div>
              {isLoading ? (
                <FAQSkeleton />
              ) : activeFAQs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No FAQs available
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
                  {activeFAQs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="bg-card rounded-2xl border border-border/60 px-6 card-elevated data-[state=open]:card-elevated-lg data-[state=open]:border-secondary/20 transition-smooth-300"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5 hover:text-secondary transition-smooth">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}