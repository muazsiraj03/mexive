import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSubscription, PlanInfo } from "@/hooks/use-subscription";
import { CurrentPlanBanner } from "@/components/subscription/CurrentPlanBanner";
import { PlanCard } from "@/components/subscription/PlanCard";
import { CancelDialog } from "@/components/subscription/CancelDialog";
import { UpgradeDialog } from "@/components/subscription/UpgradeDialog";
import { SubscriptionHistory } from "@/components/subscription/SubscriptionHistory";
import { CreditUsageHistory } from "@/components/subscription/CreditUsageHistory";
import { CreditSummaryCard } from "@/components/subscription/CreditSummaryCard";
import { CreditPacksSection } from "@/components/subscription/CreditPacksSection";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { CreditCard, Shield, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationState {
  selectedPlan?: string;
}

interface SelectedPlanWithTier extends PlanInfo {
  selectedCredits?: number;
  selectedPrice?: number;
}

export function SubscriptionPage() {
  const location = useLocation();
  const { 
    subscription, 
    subscriptionHistory,
    loading, 
    actionLoading, 
    subscribe, 
    cancel, 
    getCurrentPlan,
    plans 
  } = useSubscription();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanWithTier | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [showSelectedPlanBanner, setShowSelectedPlanBanner] = useState(false);
  const [preselectedPlanInfo, setPreselectedPlanInfo] = useState<PlanInfo | null>(null);

  const currentPlan = getCurrentPlan();
  const isPending = subscription?.status === "pending";
  
  // Get preselected plan from location state
  const locationState = location.state as LocationState | null;
  const preselectedPlanKey = locationState?.selectedPlan;

  // Auto-trigger subscription dialog if coming from pricing page with a selected plan
  useEffect(() => {
    if (loading || hasAutoTriggered) return;
    
    if (preselectedPlanKey && preselectedPlanKey !== "free" && plans.length > 0) {
      const plan = plans.find((p) => p.name === preselectedPlanKey);
      if (plan && plan.name !== currentPlan.name) {
        setSelectedPlan(plan);
        setPreselectedPlanInfo(plan);
        setUpgradeDialogOpen(true);
        setShowSelectedPlanBanner(true);
        setHasAutoTriggered(true);
        
        // Clear the navigation state so it doesn't re-trigger on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [loading, plans, currentPlan.name, preselectedPlanKey, hasAutoTriggered]);

  const handlePlanSelect = (planName: string, selectedCredits?: number, selectedPrice?: number) => {
    const plan = plans.find((p) => p.name === planName);
    if (plan && plan.name !== "free") {
      setSelectedPlan({
        ...plan,
        selectedCredits,
        selectedPrice,
      });
      setUpgradeDialogOpen(true);
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedPlan) return;
    const result = await subscribe(
      selectedPlan.name, 
      selectedPlan.selectedCredits, 
      selectedPlan.selectedPrice
    );
    if (result.success) {
      setUpgradeDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelConfirm = async () => {
    const result = await cancel();
    if (result.success) {
      setCancelDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Subscription"
        description="Manage your plan and billing preferences"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Breadcrumb */}
        <DashboardBreadcrumb />

        <div className="max-w-5xl mx-auto">
          {/* Selected Plan Banner - shown when coming from pricing page */}
          {showSelectedPlanBanner && preselectedPlanInfo && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-secondary/20 to-secondary/5 border border-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/20">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    You selected the {preselectedPlanInfo.displayName} plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${preselectedPlanInfo.price}{preselectedPlanInfo.period} • {preselectedPlanInfo.credits} credits/month
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="cta"
                  size="sm"
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="rounded-full"
                >
                  Complete your upgrade
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSelectedPlanBanner(false)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Credit Summary Card */}
          <div className="mb-6">
            <CreditSummaryCard currentPlan={currentPlan} />
          </div>

          {/* Current Plan Banner */}
          <CurrentPlanBanner
            subscription={subscription}
            currentPlan={currentPlan}
            onCancel={() => setCancelDialogOpen(true)}
            loading={actionLoading}
          />

          {/* Plans Grid */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Available Plans
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a monthly subscription plan
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  currentPlan={currentPlan.name}
                  isPending={isPending}
                  onSelect={handlePlanSelect}
                  loading={actionLoading}
                  disabled={subscription?.status === "canceled"}
                />
              ))}
            </div>
          </div>

          {/* Credit Packs Section */}
          <div className="mb-8">
            <CreditPacksSection />
          </div>

          {/* History Section */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Subscription History */}
            {subscriptionHistory.length > 0 && (
              <SubscriptionHistory history={subscriptionHistory} plans={plans} />
            )}

            {/* Credit Usage History */}
            <CreditUsageHistory />
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground border-t border-border/60 pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <span>No hidden fees</span>
          </div>

          {/* Dialogs */}
          <CancelDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            subscription={subscription}
            onConfirm={handleCancelConfirm}
            loading={actionLoading}
          />

          <UpgradeDialog
            open={upgradeDialogOpen}
            onOpenChange={setUpgradeDialogOpen}
            plan={selectedPlan}
            onConfirm={handleUpgradeConfirm}
            loading={actionLoading}
          />
        </div>
      </main>
    </>
  );
}
