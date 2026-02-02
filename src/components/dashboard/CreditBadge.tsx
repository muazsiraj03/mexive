import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  credits: number;
  totalCredits: number;
  isAdmin?: boolean;
  hasUnlimitedCredits?: boolean;
  className?: string;
}

export function CreditBadge({ credits, totalCredits, isAdmin = false, hasUnlimitedCredits = false, className }: CreditBadgeProps) {
  const showUnlimited = isAdmin || hasUnlimitedCredits;
  const percentage = showUnlimited ? 100 : (credits / totalCredits) * 100;
  const isLow = !showUnlimited && percentage < 20;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 card-elevated",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl",
            "bg-secondary/10"
          )}
        >
          <Sparkles
            className={cn("h-7 w-7", isLow ? "text-destructive" : "text-secondary")}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">Credits Remaining</p>
          <p className="text-2xl font-bold text-foreground">
            {showUnlimited ? (
              <>∞ <span className="text-base font-normal text-muted-foreground">Unlimited</span></>
            ) : (
              <>{credits}</>
            )}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Progress
          value={percentage}
          className={cn("h-2", isLow && "[&>div]:bg-destructive")}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {showUnlimited
            ? "Unlimited credits - no restrictions"
            : isLow
              ? "Running low! Consider upgrading your plan."
              : `${Math.round(percentage)}% of monthly credits remaining`}
        </p>
      </div>
    </div>
  );
}