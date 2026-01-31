import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFAQs } from "@/hooks/use-faqs";

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

export function FAQSection() {
  const { faqs, isLoading } = useFAQs();

  // Filter to only show active FAQs
  const activeFAQs = faqs.filter((f) => f.is_active);

  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about AI Stock Metadata Generator
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
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
    </section>
  );
}
