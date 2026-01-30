import { 
  Wand2, 
  MessageSquareText, 
  FileCheck, 
  Layers, 
  Files, 
  Download, 
  Coins 
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Metadata Generator",
    description: "Generate optimized titles, descriptions & keywords for Adobe Stock, Freepik & Shutterstock.",
  },
  {
    icon: MessageSquareText,
    title: "Image to Prompt",
    description: "Extract detailed AI prompts from any image for Midjourney, DALL-E & Stable Diffusion.",
  },
  {
    icon: FileCheck,
    title: "File Reviewer",
    description: "AI-powered quality control against marketplace rejection standards before upload.",
  },
  {
    icon: Layers,
    title: "Marketplace-Specific Output",
    description: "Tailored formatting for Adobe Stock, Freepik, and Shutterstock requirements.",
  },
  {
    icon: Files,
    title: "Bulk Processing",
    description: "Process multiple images at once with batch queue and progress tracking.",
  },
  {
    icon: Download,
    title: "SEO-Optimized Downloads",
    description: "Download with embedded XMP metadata and SEO-friendly filenames.",
  },
  {
    icon: Coins,
    title: "Flexible Pricing",
    description: "Credit-based usage with monthly subscriptions and one-time top-up packs.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline your stock photography workflow
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:-translate-y-1 hover:border-secondary/20"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                <feature.icon className="w-5 h-5 text-secondary group-hover:text-secondary-foreground transition-smooth-300" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
