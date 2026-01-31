import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBenefits } from "@/hooks/use-benefits";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

function BenefitsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
      {Array.from({ length: 5 }).map((_, i) => (
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

export function BenefitsSection() {
  const { benefits, isLoading, getBenefitsByTool } = useBenefits();
  const [activeTab, setActiveTab] = useState("metadata-generator");

  const currentBenefits = getBenefitsByTool(activeTab);

  const renderIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[iconName];
    return IconComponent ? (
      <IconComponent className="w-5 h-5 text-secondary group-hover:text-secondary-foreground transition-smooth-300" />
    ) : null;
  };

  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Contributors Love Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Purpose-built for stock contributors who want to focus on creating, not typing
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-lg">
              {TOOLS.map((tool) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className="px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
                >
                  {tool.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <BenefitsSkeleton />
        ) : currentBenefits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No benefits configured for this tool yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
            {currentBenefits.map((benefit) => (
              <div
                key={benefit.id}
                className="bg-card rounded-2xl p-6 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:-translate-y-1 hover:border-secondary/20 group"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                  {renderIcon(benefit.icon)}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
