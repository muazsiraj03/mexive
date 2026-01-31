import { useState } from "react";
import { ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useHowItWorks } from "@/hooks/use-how-it-works";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

function StepsSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-8 md:gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl p-8 border border-border/60">
          <div className="relative mb-6">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <Skeleton className="absolute -top-2 -right-2 w-7 h-7 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function HowItWorksSection() {
  const { steps, loading, getStepsByTool } = useHowItWorks();
  const [activeTab, setActiveTab] = useState("metadata-generator");

  const getIconComponent = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = icons[iconName];
    return Icon || LucideIcons.Cpu;
  };

  const currentSteps = getStepsByTool(activeTab);

  return (
    <section id="how-it-works" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            From upload to upload-ready results in three simple steps
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

        {loading ? (
          <StepsSkeleton />
        ) : (
          <div className="relative max-w-5xl mx-auto">
            {/* Connection line */}
            {currentSteps.length > 1 && (
              <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-border/40 via-secondary/30 to-border/40" />
            )}

            <div className="grid md:grid-cols-3 gap-8 md:gap-5">
              {currentSteps.map((step, index) => {
                const IconComponent = getIconComponent(step.icon);
                
                return (
                  <div key={step.id} className="relative group">
                    <div className="bg-card rounded-2xl p-8 border border-border/60 card-elevated transition-smooth-300 hover:card-elevated-lg hover:border-secondary/20 hover:-translate-y-1 h-full">
                      {/* Icon */}
                      <div className="relative mb-6">
                        <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:scale-105 transition-smooth-300">
                          <IconComponent className="w-6 h-6 text-secondary group-hover:text-secondary-foreground transition-smooth-300" />
                        </div>
                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shadow-sm">
                          {step.step_number}
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
                    {index < currentSteps.length - 1 && (
                      <div className="hidden md:flex absolute top-24 -right-3 w-6 h-6 items-center justify-center text-muted-foreground/50 z-10">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {currentSteps.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No steps configured for this tool yet.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
