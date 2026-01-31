import { useMemo } from "react";
import { startOfMonth, isAfter } from "date-fns";
import { Coins, TrendingUp, Wallet, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCreditPacks } from "@/hooks/use-credit-packs";
import { PlanInfo } from "@/hooks/use-subscription";

interface CreditSummaryCardProps {
  currentPlan: PlanInfo;
}

export function CreditSummaryCard({ currentPlan }: CreditSummaryCardProps) {
  const { user, generations } = useDashboard();
  const { purchases } = useCreditPacks();

  const creditsUsedThisMonth = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    return generations
      .filter((gen) => isAfter(gen.createdAt, monthStart))
      .reduce((total, gen) => total + gen.marketplaces.length, 0);
  }, [generations]);

  // Calculate purchased credits from completed credit pack purchases
  const purchasedCredits = useMemo(() => {
    return purchases
      .filter((p) => p.status === "completed")
      .reduce((total, p) => total + p.credits, 0);
  }, [purchases]);

  // Monthly subscription credits (from the plan/tier selection)
  const monthlyCredits = user.totalCredits > 0 ? user.totalCredits : currentPlan.credits;
  
  // Available credits breakdown
  const totalAvailable = user.credits;
  
  const usagePercentage = monthlyCredits > 0 
    ? Math.min((creditsUsedThisMonth / monthlyCredits) * 100, 100) 
    : 0;

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card to-muted/20">
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Credits Used This Month */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Used This Month</p>
              <p className="text-2xl font-bold text-foreground">
                {creditsUsedThisMonth}
                <span className="text-base font-normal text-muted-foreground">
                  {monthlyCredits > 0 ? ` / ${monthlyCredits}` : ""}
                </span>
              </p>
              {monthlyCredits > 0 && (
                <Progress value={usagePercentage} className="mt-2 h-1.5" />
              )}
            </div>
          </div>

          {/* Monthly Subscription Credits */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Monthly Credits</p>
              <p className="text-2xl font-bold text-foreground">
                {user.hasUnlimitedCredits ? "∞" : monthlyCredits}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {currentPlan.displayName} plan
              </p>
            </div>
          </div>

          {/* Purchased Credit Packs */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Purchased Packs</p>
              <p className="text-2xl font-bold text-foreground">{purchasedCredits}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time credits</p>
            </div>
          </div>

          {/* Total Available */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
              <Wallet className="h-6 w-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Available Now</p>
              <p className="text-2xl font-bold text-foreground">
                {user.hasUnlimitedCredits ? "∞" : totalAvailable}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
            </div>
          </div>
        </div>

        {/* Credit breakdown note */}
        {purchasedCredits > 0 && !user.hasUnlimitedCredits && (
          <>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground text-center">
              Your available credits include {monthlyCredits} monthly + {purchasedCredits} from credit packs
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
