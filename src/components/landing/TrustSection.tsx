import { Shield, Eye, FileCheck, Lock } from "lucide-react";

const trustItems = [
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Powered by UddoktaPay for safe, reliable transactions",
  },
  {
    icon: Eye,
    title: "No Watermarks",
    description: "Your images are never watermarked or modified",
  },
  {
    icon: FileCheck,
    title: "No Copyright Claims",
    description: "We never claim any rights to your content",
  },
  {
    icon: Shield,
    title: "Data Privacy",
    description: "Your images are processed securely and not stored long-term",
  },
];

export function TrustSection() {
  return (
    <section className="section-padding-sm bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Built on Trust
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your content and data are always protected
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="text-center p-6 bg-card rounded-2xl border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:-translate-y-1 hover:border-success/20 group"
            >
              <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-success group-hover:scale-105 transition-smooth-300">
                <item.icon className="w-5 h-5 text-success group-hover:text-success-foreground transition-smooth-300" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
