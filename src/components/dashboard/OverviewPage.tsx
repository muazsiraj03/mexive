import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  ImagePlus, 
  ArrowRight, 
  Wand2, 
  MessageSquareText,
  Sparkles,
  FileSearch,
  Images
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { useDashboard } from "@/hooks/use-dashboard";
import { AnimatedSection } from "@/components/ui/animated-section";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const tools = [
  {
    title: "Metadata Generator",
    description: "AI-powered titles, descriptions & keywords",
    icon: Wand2,
    href: "/dashboard/generate",
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "Image to Prompt",
    description: "Extract AI prompts from any image",
    icon: MessageSquareText,
    href: "/dashboard/image-to-prompt",
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "File Reviewer",
    description: "Check files before marketplace submission",
    icon: FileSearch,
    href: "/dashboard/file-reviewer",
    color: "bg-secondary/10 text-secondary",
  },
];

interface ToolStats {
  promptsGenerated: number;
  filesReviewed: number;
  passRate: number;
}

interface RecentPrompt {
  id: string;
  image_url: string;
  prompt: string;
  style: string;
  created_at: string;
}

interface RecentReview {
  id: string;
  image_url: string;
  file_name: string;
  verdict: string;
  overall_score: number;
  created_at: string;
}

export function OverviewPage() {
  const { user, generations, isAdmin } = useDashboard();
  const { user: authUser } = useAuth();
  const [toolStats, setToolStats] = useState<ToolStats>({
    promptsGenerated: 0,
    filesReviewed: 0,
    passRate: 0,
  });
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const recentGenerations = generations.slice(0, 5);

  // Metadata Generator stats
  const totalImages = generations.length;

  // Credits
  const showUnlimited = isAdmin || user.hasUnlimitedCredits;
  const creditPercentage = showUnlimited ? 100 : (user.credits / user.totalCredits) * 100;
  const isLowCredits = !showUnlimited && creditPercentage < 20;

  // Fetch additional stats and recent activity from other tools
  useEffect(() => {
    const fetchToolStats = async () => {
      if (!authUser) return;

      setIsLoadingStats(true);
      try {
        // Fetch prompt history count and recent prompts
        const { count: promptCount, data: promptData } = await supabase
          .from("prompt_history")
          .select("id, image_url, prompt, style, created_at", { count: "exact" })
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch file reviews and recent reviews
        const { data: fileReviews } = await supabase
          .from("file_reviews")
          .select("id, image_url, file_name, verdict, overall_score, created_at")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });

        const filesReviewed = fileReviews?.length || 0;
        const passedFiles = fileReviews?.filter(r => r.verdict === "pass").length || 0;
        const passRate = filesReviewed > 0 ? Math.round((passedFiles / filesReviewed) * 100) : 0;

        setToolStats({
          promptsGenerated: promptCount || 0,
          filesReviewed,
          passRate,
        });
        setRecentPrompts(promptData || []);
        setRecentReviews(fileReviews?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error fetching tool stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchToolStats();
  }, [authUser]);

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${user.name.split(" ")[0] || "there"}!`}
        description="Your AI-powered stock content toolkit at a glance"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-7xl space-y-6">
          <DashboardBreadcrumb />

          {/* Main Stats */}
          <AnimatedSection variant="fade-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Credits Card */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                    isLowCredits ? "bg-destructive/10" : "bg-secondary/10"
                  )}>
                    <Sparkles className={cn("h-6 w-6", isLowCredits ? "text-destructive" : "text-secondary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Credits</p>
                    <p className="text-2xl font-bold text-foreground">
                      {showUnlimited ? "∞" : user.credits}
                    </p>
                  </div>
                </div>
                <Progress
                  value={creditPercentage}
                  className={cn("h-1.5 mt-3", isLowCredits && "[&>div]:bg-destructive")}
                />
              </div>

              {/* Metadata Generations */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <Images className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Metadata Generated</p>
                    <p className="text-2xl font-bold text-foreground">{totalImages}</p>
                  </div>
                </div>
              </div>

              {/* Prompts Generated */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <MessageSquareText className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Prompts Extracted</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingStats ? "..." : toolStats.promptsGenerated}
                    </p>
                  </div>
                </div>
              </div>

              {/* Files Reviewed */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <FileSearch className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Files Reviewed</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingStats ? "..." : toolStats.filesReviewed}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Quick Tools Grid */}
          <AnimatedSection variant="fade-up" delay={100}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  to={tool.href}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/20 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110", tool.color)}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{tool.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          </AnimatedSection>

          {/* Quick Upload CTA */}
          <AnimatedSection variant="fade-up" delay={150}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent p-6 md:p-8">
              <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20">
                    <Sparkles className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                      Ready to generate metadata?
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Upload your images and get AI-powered metadata for Adobe Stock, Shutterstock & Freepik
                    </p>
                  </div>
                </div>
                <Button asChild variant="cta" size="lg" className="w-full rounded-full md:w-auto">
                  <Link to="/dashboard/generate">
                    <ImagePlus className="mr-2 h-5 w-5" />
                    Upload Images
                  </Link>
                </Button>
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-secondary/5 blur-2xl" />
            </div>
          </AnimatedSection>

          {/* Recent Activity Grid */}
          <AnimatedSection variant="fade-up" delay={200}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Recent Metadata Generations */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <Images className="h-4 w-4 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Metadata</h3>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-secondary hover:bg-secondary/10 h-7 px-2">
                    <Link to="/dashboard/generate">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentGenerations.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No generations yet</p>
                  ) : (
                    recentGenerations.slice(0, 4).map((gen) => (
                      <div
                        key={gen.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-2 transition-all hover:bg-muted/50"
                      >
                        <img
                          src={gen.imageUrl}
                          alt={gen.fileName}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {gen.displayName || gen.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(gen.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Prompts */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <MessageSquareText className="h-4 w-4 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Prompts</h3>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-secondary hover:bg-secondary/10 h-7 px-2">
                    <Link to="/dashboard/image-to-prompt">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoadingStats ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                  ) : recentPrompts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No prompts yet</p>
                  ) : (
                    recentPrompts.slice(0, 4).map((prompt) => (
                      <div
                        key={prompt.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-2 transition-all hover:bg-muted/50"
                      >
                        <img
                          src={prompt.image_url}
                          alt="Prompt source"
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {prompt.prompt.slice(0, 40)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <FileSearch className="h-4 w-4 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Reviews</h3>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-secondary hover:bg-secondary/10 h-7 px-2">
                    <Link to="/dashboard/file-reviewer">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoadingStats ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                  ) : recentReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet</p>
                  ) : (
                    recentReviews.slice(0, 4).map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-2 transition-all hover:bg-muted/50"
                      >
                        <img
                          src={review.image_url}
                          alt={review.file_name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {review.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <span className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                          review.verdict === "pass" ? "bg-secondary/10 text-secondary" : 
                          review.verdict === "fail" ? "bg-destructive/10 text-destructive" : 
                          "bg-accent/20 text-accent-foreground"
                        )}>
                          {review.verdict}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Quick Info Cards */}
          <AnimatedSection variant="fade-up" delay={250}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h3 className="font-semibold text-foreground">Supported Marketplaces</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Adobe Stock", "Shutterstock", "Freepik"].map((mp) => (
                    <span
                      key={mp}
                      className="rounded-full bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary"
                    >
                      {mp}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Optimized metadata for each platform's requirements
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
                <h3 className="font-semibold text-foreground">Current Plan</h3>
                <p className="mt-2 text-2xl font-bold capitalize text-secondary">
                  {user.plan}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.plan === "free"
                    ? "Upgrade for more credits"
                    : "Premium features enabled"}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
                  <Link to="/dashboard/subscription">
                    {user.plan === "free" ? "Upgrade Plan" : "Manage Subscription"}
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </>
  );
}
