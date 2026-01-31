import * as LucideIcons from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatures } from "@/hooks/use-features";

function FeaturesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-6 border border-border/60">
          <Skeleton className="w-11 h-11 rounded-xl mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mt-1" />
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  const { features, isLoading } = useFeatures();

  // Filter to only show active features
  const activeFeatures = features.filter((f) => f.is_active);

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 text-secondary group-hover:text-secondary-foreground transition-smooth-300" /> : null;
  };

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

        {isLoading ? (
          <FeaturesSkeleton />
        ) : activeFeatures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No features available
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {activeFeatures.map((feature) => (
              <div
                key={feature.id}
                className="group bg-card rounded-2xl p-6 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:-translate-y-1 hover:border-secondary/20"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                  {renderIcon(feature.icon)}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}