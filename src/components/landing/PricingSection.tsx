import { Check, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePricing } from "@/hooks/use-pricing";
import { useCreditPacks } from "@/hooks/use-credit-packs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PricingSection() {
  const { plans, loading } = usePricing();
  const { packs, loading: packsLoading } = useCreditPacks();
  const navigate = useNavigate();

  // Map database plans directly to landing page display format
  const landingPlans = plans.map(plan => {
    return {
      name: plan.displayName,
      planKey: plan.name,
      description: plan.name === "free" 
        ? "Test the platform with limited credits" 
        : plan.name === "pro" 
        ? "For regular contributors" 
        : "For power users & teams",
      price: plan.price === 0 ? "Free" : `$${plan.price}`,
      period: plan.period,
      credits: plan.name === "free" 
        ? `${plan.credits} credits included` 
        : `${plan.credits} credits/month`,
      features: plan.features.filter(f => !f.toLowerCase().includes("credits")),
      cta: plan.name === "free" ? "Start Free Trial" : "Subscribe Now",
      popular: plan.isPopular,
    };
  });

  const handlePlanClick = (planKey: string) => {
    // Navigate to auth page with plan info in state
    navigate("/auth", { state: { selectedPlan: planKey } });
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const getPricePerCredit = (pack: { priceCents: number; credits: number; bonusCredits: number }) => {
    const totalCredits = pack.credits + pack.bonusCredits;
    return (pack.priceCents / 100 / totalCredits).toFixed(3);
  };

  if (loading) {
    return (
      <section id="pricing" className="section-padding bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your workflow. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/60">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-40 mb-6" />
                <Skeleton className="h-10 w-20 mb-6" />
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-11 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="section-padding bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your workflow. No hidden fees.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {landingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-6 border transition-smooth-300 hover:-translate-y-1 flex flex-col h-full ${
                plan.popular
                  ? "border-secondary/40 card-elevated-lg scale-[1.02] hover:border-secondary/60"
                  : "border-border/60 card-elevated hover:card-elevated-lg hover:border-secondary/20"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground shadow-sm">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-secondary font-medium mt-2">{plan.credits}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handlePlanClick(plan.planKey)}
                className={`w-full rounded-full font-medium btn-hover-lift mt-auto ${
                  plan.popular 
                    ? "bg-foreground text-background hover:bg-foreground/85" 
                    : "bg-transparent border border-foreground/20 text-foreground hover:bg-muted hover:border-foreground/30 hover:text-foreground"
                }`} 
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Credit Packs Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">Need More Credits?</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Top Up Your Credits Anytime
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Purchase additional credits when you need them. The more you buy, the more you save.
            </p>
          </div>

          {packsLoading ? (
            <div className="bg-card rounded-2xl border border-border/60 p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : packs.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden card-elevated">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Pack</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Credits</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Bonus</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Price</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Per Credit</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow 
                      key={pack.id} 
                      className={`border-border/60 transition-colors ${
                        pack.isPopular ? "bg-secondary/5" : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {pack.name}
                          {pack.isPopular && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="w-3 h-3" />
                              Best Value
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{pack.credits.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {pack.bonusCredits > 0 ? (
                          <Badge variant="outline" className="text-primary border-primary/30">
                            +{pack.bonusCredits.toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatPrice(pack.priceCents)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        ${getPricePerCredit(pack)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={pack.isPopular ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => navigate("/auth", { state: { creditPack: pack.id } })}
                        >
                          Buy Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>

        {/* Trust line */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          No hidden fees • Cancel anytime • Secure payments
        </p>
      </div>
    </section>
  );
}
