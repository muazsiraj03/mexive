import { Package, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreditPack } from "@/hooks/use-credit-packs";

interface CreditPackCardProps {
  pack: CreditPack;
  onPurchase: (packId: string) => void;
  loading?: boolean;
}

export function CreditPackCard({ pack, onPurchase, loading }: CreditPackCardProps) {
  const totalCredits = pack.credits + pack.bonusCredits;
  const pricePerCredit = (pack.priceCents / 100 / totalCredits).toFixed(2);

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        pack.isPopular
          ? "border-secondary/40 shadow-md"
          : "border-border/60 shadow-sm"
      )}
    >
      {pack.isPopular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground shadow-sm text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Best Value
        </Badge>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          pack.isPopular ? "bg-secondary/20" : "bg-muted"
        )}>
          <Package className={cn(
            "w-5 h-5",
            pack.isPopular ? "text-secondary" : "text-muted-foreground"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{pack.name}</h3>
          <p className="text-xs text-muted-foreground">${pricePerCredit}/credit</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">
            ${(pack.priceCents / 100).toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-secondary">
            {pack.credits} credits
          </span>
          {pack.bonusCredits > 0 && (
            <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/30">
              <Plus className="w-3 h-3 mr-0.5" />
              {pack.bonusCredits} bonus
            </Badge>
          )}
        </div>
        {pack.bonusCredits > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: {totalCredits} credits
          </p>
        )}
      </div>

      <Button
        onClick={() => onPurchase(pack.id)}
        disabled={loading}
        variant={pack.isPopular ? "default" : "outline"}
        className={cn(
          "w-full rounded-full font-medium",
          pack.isPopular && "bg-foreground text-background hover:bg-foreground/85"
        )}
      >
        {loading ? "Processing..." : "Buy Now"}
      </Button>
    </div>
  );
}
