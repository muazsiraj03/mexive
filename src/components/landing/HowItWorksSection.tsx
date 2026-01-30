import { Upload, Cpu, FileCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Image",
    description: "Single or bulk upload your images. Supports JPG, PNG, and other common formats.",
  },
  {
    icon: Cpu,
    number: "02",
    title: "AI Analyzes Content",
    description: "Our AI identifies subjects, context, intent, and ensures marketplace compliance.",
  },
  {
    icon: FileCheck,
    number: "03",
    title: "Get Ready Metadata",
    description: "Receive upload-ready titles, descriptions, and keywords for each marketplace.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From upload to upload-ready metadata in three simple steps
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-border/40 via-secondary/30 to-border/40" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-5">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                <div className="bg-card rounded-2xl p-8 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:border-secondary/20 hover:-translate-y-1 h-full">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                      <step.icon className="w-6 h-6 text-secondary group-hover:text-secondary-foreground transition-smooth-300" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shadow-sm">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between cards */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-24 -right-3 w-6 h-6 items-center justify-center text-muted-foreground/50 z-10">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
