import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Heart, Zap, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're dedicated to helping stock contributors succeed by removing tedious manual work from their workflow.",
  },
  {
    icon: Zap,
    title: "Innovation First",
    description: "We leverage cutting-edge AI technology to deliver tools that are faster, smarter, and more accurate.",
  },
  {
    icon: Heart,
    title: "Creator-Focused",
    description: "Every feature we build starts with understanding the real challenges faced by stock photographers and artists.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We're building more than a product—we're building a community of creators helping each other succeed.",
  },
];

const About = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container max-w-4xl text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About {settings.appName}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're on a mission to revolutionize how stock contributors create and manage their content. 
            Our AI-powered tools help creators spend less time on tedious tasks and more time doing what they love.
          </p>
        </section>

        {/* Story Section */}
        <section className="container max-w-4xl mb-16">
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {settings.appName} was born from a simple frustration: spending hours writing metadata for stock images 
              instead of creating new content. As stock contributors ourselves, we knew there had to be a better way.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In 2024, we set out to build the tools we wished existed. Using the latest advances in artificial intelligence, 
              we created a suite of tools that understand images the way humans do—but work infinitely faster.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, thousands of creators trust {settings.appName} to generate accurate titles, descriptions, and keywords 
              for their work across major stock marketplaces including Shutterstock, Adobe Stock, and Freepik.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="container max-w-5xl mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="flex gap-4 p-6 rounded-xl border border-border bg-card">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container max-w-4xl text-center">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators who are already saving hours every week with {settings.appName}.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Start Free Today</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
