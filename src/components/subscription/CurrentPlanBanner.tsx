import { Crown, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Subscription, PlanInfo } from "@/hooks/use-subscription";
import { useDashboard } from "@/hooks/use-dashboard";
import { format } from "date-fns";

interface CurrentPlanBannerProps {
  subscription: Subscription | null;
  currentPlan: PlanInfo;
  onCancel: () => void;
  loading?: boolean;
}

export function CurrentPlanBanner({ 
  subscription, 
  currentPlan, 
  onCancel,
  loading 
}: CurrentPlanBannerProps) {
  const { user } = useDashboard();
  
  // Use user's actual total credits (reflects selected tier) instead of base plan credits
  const userTotalCredits = user.totalCredits > 0 ? user.totalCredits : currentPlan.credits;
  const getStatusIcon = () => {
    if (!subscription) return <Crown className="w-5 h-5" />;
    
    switch (subscription.status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "canceled":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Crown className="w-5 h-5" />;
    }
  };

  const getStatusBadge = () => {
    if (!subscription || subscription.status === "expired") {
      return <Badge variant="secondary">Free Tier</Badge>;
    }

    switch (subscription.status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Approval</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return null;
    }
  };

  const showCancelButton = subscription?.status === "active" && subscription.plan !== "free";

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {getStatusIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-foreground">
                {currentPlan.displayName} Plan
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription?.status === "pending" ? (
                "Your subscription request is being reviewed"
              ) : subscription?.status === "canceled" && subscription.expiresAt ? (
                `Access until ${format(subscription.expiresAt, "MMM d, yyyy")}`
              ) : subscription?.expiresAt ? (
                `Renews ${format(subscription.expiresAt, "MMM d, yyyy")} • ${userTotalCredits} credits/month`
              ) : (
                `${userTotalCredits} credits included`
              )}
            </p>
          </div>
        </div>

        {showCancelButton && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            Cancel Subscription
          </Button>
        )}
      </div>
    </div>
  );
}
