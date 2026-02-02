import { Sparkles, LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/use-dashboard";

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

interface ToolStatsBarProps {
  stats?: StatItem[];
  className?: string;
}

export function ToolStatsBar({ stats = [], className }: ToolStatsBarProps) {
  const { user, isAdmin } = useDashboard();
  
  const showUnlimited = isAdmin || user.hasUnlimitedCredits;
  const percentage = showUnlimited ? 100 : (user.credits / user.totalCredits) * 100;
  const isLow = !showUnlimited && percentage < 20;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Credits Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 card-elevated">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
            <Sparkles className={cn("h-5 w-5", isLow ? "text-destructive" : "text-secondary")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Credits</p>
              <p className="text-sm font-semibold text-foreground">
                {showUnlimited ? "∞" : user.credits}
              </p>
            </div>
            <Progress
              value={percentage}
              className={cn("h-1.5 mt-1", isLow && "[&>div]:bg-destructive")}
            />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/60 bg-card p-4 card-elevated"
        >
          <div className="flex items-center gap-3">
            {stat.icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                <stat.icon className="h-5 w-5 text-secondary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
