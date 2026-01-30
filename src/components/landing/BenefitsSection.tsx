import { Clock, CheckCircle, Search, Shield, User } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Faster Uploads",
    description: "Save hours per batch with automated metadata generation",
  },
  {
    icon: CheckCircle,
    title: "Higher Acceptance Rate",
    description: "Metadata that follows marketplace-specific guidelines",
  },
  {
    icon: Search,
    title: "SEO-Optimized Keywords",
    description: "AI-selected keywords for maximum search visibility",
  },
  {
    icon: Shield,
    title: "No Keyword Stuffing",
    description: "Clean, relevant tags that won't trigger rejections",
  },
  {
    icon: User,
    title: "Built for Contributors",
    description: "Designed for individual stock photographers and creators",
  },
];

export function BenefitsSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Contributors Love Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for stock contributors who want to focus on creating, not typing
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-card rounded-2xl p-6 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:-translate-y-1 hover:border-secondary/20 group"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                <benefit.icon className="w-5 h-5 text-secondary group-hover:text-secondary-foreground transition-smooth-300" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
