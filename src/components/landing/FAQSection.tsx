import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What AI tools does MetaGen offer?",
    answer:
      "MetaGen provides four powerful AI tools: Metadata Generator for creating marketplace-ready titles, descriptions, and keywords; Image to Prompt for reverse-engineering image prompts; Background Remover for creating transparent backgrounds; and File Reviewer for checking images against marketplace requirements before submission.",
  },
  {
    question: "How many credits does each tool use?",
    answer:
      "Each tool uses 1 credit per image processed. The Metadata Generator uses 1 credit per image for up to 3 marketplaces simultaneously. Image to Prompt, Background Remover, and File Reviewer each use 1 credit per image. Batch processing multiple images will use 1 credit per image in the batch.",
  },
  {
    question: "Is the metadata accepted by Adobe Stock / Freepik / Shutterstock?",
    answer:
      "Yes! Our Metadata Generator follows each marketplace's specific formatting rules, character limits, and keyword guidelines. This significantly increases acceptance rates compared to manually written metadata. We support Adobe Stock, Shutterstock, Freepik, and more.",
  },
  {
    question: "How accurate is the Image to Prompt feature?",
    answer:
      "Our Image to Prompt tool uses advanced AI to analyze visual elements, style, composition, and mood. It generates detailed prompts that capture the essence of your images, making it perfect for recreating successful styles or understanding what makes images sell.",
  },
  {
    question: "What file formats does the Background Remover support?",
    answer:
      "The Background Remover supports JPEG, PNG, and WebP formats. Output is always in PNG format to preserve transparency. The AI handles complex edges like hair, fur, and transparent objects with high precision.",
  },
  {
    question: "What does the File Reviewer check for?",
    answer:
      "The File Reviewer analyzes technical quality (resolution, noise, artifacts), composition, commercial viability, and marketplace-specific requirements. It provides a detailed report with pass/warning/fail status and actionable suggestions for improvement.",
  },
  {
    question: "How many images can I process at once?",
    answer:
      "You can batch process up to 10 images at a time with the Metadata Generator. Other tools currently support single-image processing for optimal quality. Processing time is typically 5-10 seconds per image.",
  },
  {
    question: "What happens when credits run out?",
    answer:
      "When you run out of credits, you can purchase more through our credit packs or upgrade to a subscription plan. Your account, history, and settings remain intact. We'll notify you when credits are running low.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time with no cancellation fees. Your access continues until the end of your billing period, and any remaining credits can still be used.",
  },
  {
    question: "Do you store my images?",
    answer:
      "Images are only temporarily stored during processing and are automatically deleted within 24 hours. We never use your images for training or any purpose other than generating your results. Your creative work remains yours.",
  },
];

export function FAQSection() {
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
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
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
        </div>
      </div>
    </section>
  );
}
