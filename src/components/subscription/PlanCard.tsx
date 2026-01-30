import { useState, useEffect } from "react";
import { Check, Sparkles, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanInfo } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { CreditTierSelector, CreditTier, useDefaultTier } from "./CreditTierSelector";

interface PlanCardProps {
  plan: PlanInfo;
  currentPlan: string;
  isPending: boolean;
  onSelect: (planName: string, selectedCredits?: number, selectedPrice?: number) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PlanCard({ 
  plan, 
  currentPlan, 
  isPending,
  onSelect, 
  loading,
  disabled,
}: PlanCardProps) {
  const isCurrent = currentPlan === plan.name;
  const isUpgrade = getUpgradeStatus(currentPlan, plan.name);
  const isDowngrade = getDowngradeStatus(currentPlan, plan.name);
  
  // Check if plan has tiers (starter and pro do, unlimited does not)
  const hasTiers = plan.name === "starter" || plan.name === "pro";
  const isUnlimited = plan.name === "unlimited";
  // Get default tier from database
  const defaultTier = useDefaultTier(plan.name);
  
  // State for selected tier
  const [selectedTier, setSelectedTier] = useState<CreditTier | null>(null);

  // Initialize selected tier when default is loaded
  useEffect(() => {
    if (defaultTier && !selectedTier) {
      setSelectedTier(defaultTier);
    }
  }, [defaultTier, selectedTier]);

  // Use selected tier values or fall back to plan defaults
  const displayCredits = selectedTier?.credits ?? plan.credits;
  const displayPrice = selectedTier?.price ?? plan.price;

  const handleTierChange = (credits: number, price: number) => {
    setSelectedTier({ credits, price });
  };

  const handleSelect = () => {
    if (hasTiers && selectedTier) {
      onSelect(plan.name, selectedTier.credits, selectedTier.price);
    } else {
      onSelect(plan.name, undefined, undefined);
    }
  };

  const getButtonText = () => {
    if (isPending && plan.name !== "free") return "Pending Approval";
    if (isCurrent) return "Current Plan";
    if (isUpgrade) return "Upgrade";
    if (isDowngrade) return "Downgrade";
    return "Select Plan";
  };

  const getButtonVariant = () => {
    if (isCurrent || isPending) return "outline";
    if (plan.popular) return "default";
    return "outline";
  };

  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 flex flex-col h-full",
        plan.popular
          ? "border-secondary/40 shadow-lg scale-[1.02] hover:border-secondary/60"
          : isUnlimited 
            ? "border-primary/40 shadow-lg hover:border-primary/60 bg-gradient-to-b from-card to-primary/5"
            : "border-border/60 shadow-md hover:shadow-lg hover:border-secondary/20",
        isCurrent && "ring-2 ring-primary"
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground shadow-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}

      {isUnlimited && !isCurrent && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-sm">
          <Infinity className="w-3 h-3 mr-1" />
          Best Value
        </Badge>
      )}

      {isCurrent && (
        <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground shadow-sm">
          Current
        </Badge>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-1">
          {plan.displayName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {plan.price === 0 ? "Get started for free" : 
           `${plan.credits.toLocaleString()} credits${plan.period}`}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">
            ${displayPrice}
          </span>
          <span className="text-muted-foreground">
            {plan.period}
          </span>
        </div>
        <p className="text-sm text-secondary font-medium mt-2 flex items-center gap-1">
          {isUnlimited ? (
            <>
              <Infinity className="w-4 h-4" />
              Unlimited credits
            </>
          ) : (
            <>
              {displayCredits} credits{plan.name !== "free" ? "/month" : " included"}
            </>
          )}
        </p>
      </div>

      {/* Credit Tier Selector for paid plans */}
      {hasTiers && (
        <div className="mb-6">
          <CreditTierSelector
            planName={plan.name}
            selectedCredits={selectedTier?.credits ?? plan.credits}
            onSelect={handleTierChange}
            disabled={isCurrent || isPending || loading || disabled}
          />
        </div>
      )}

      <ul className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleSelect}
        disabled={isCurrent || isPending || loading || disabled || plan.name === "free"}
        variant={getButtonVariant()}
        className={cn(
          "w-full rounded-full font-medium transition-all mt-auto",
          plan.popular && !isCurrent && !isPending && "bg-foreground text-background hover:bg-foreground/85",
          isUnlimited && !isCurrent && !isPending && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        size="lg"
      >
        {loading ? "Processing..." : getButtonText()}
      </Button>
    </div>
  );
}

function getUpgradeStatus(current: string, target: string): boolean {
  const order = ["free", "starter", "pro", "unlimited"];
  return order.indexOf(target) > order.indexOf(current);
}

function getDowngradeStatus(current: string, target: string): boolean {
  const order = ["free", "starter", "pro", "unlimited"];
  return order.indexOf(target) < order.indexOf(current);
}
