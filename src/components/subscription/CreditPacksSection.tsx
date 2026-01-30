import { useState } from "react";
import { useCreditPacks } from "@/hooks/use-credit-packs";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, AlertCircle, Sparkles, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditPack } from "@/hooks/use-credit-packs";

export function CreditPacksSection() {
  const { packs, loading, purchaseLoading, purchasePack } = useCreditPacks();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [confirmPack, setConfirmPack] = useState<CreditPack | null>(null);

  const handlePurchase = (packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    if (pack) {
      setConfirmPack(pack);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!confirmPack) return;
    
    await purchasePack(confirmPack.id);
    setConfirmPack(null);
  };

  // Don't show if credit packs are disabled
  if (!settingsLoading && !settings.enableCreditPacks) {
    return null;
  }

  if (loading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (packs.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-secondary" />
            <CardTitle>Credit Packs</CardTitle>
          </div>
          <CardDescription>
            Need more credits? Purchase a one-time credit pack to top up your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pack</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Bonus</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Per Credit</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => {
                  const totalCredits = pack.credits + pack.bonusCredits;
                  const pricePerCredit = (pack.priceCents / 100 / totalCredits).toFixed(2);

                  return (
                    <TableRow key={pack.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pack.name}</span>
                          {pack.isPopular && (
                            <Badge className="bg-secondary text-secondary-foreground text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Best Value
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pack.credits}
                      </TableCell>
                      <TableCell className="text-center">
                        {pack.bonusCredits > 0 ? (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                            <Plus className="w-3 h-3 mr-0.5" />
                            {pack.bonusCredits}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-secondary">
                        {totalCredits}
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        ${(pack.priceCents / 100).toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${pricePerCredit}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handlePurchase(pack.id)}
                          disabled={purchaseLoading}
                          variant={pack.isPopular ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                        >
                          {purchaseLoading ? "..." : "Buy"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmPack} onOpenChange={(open) => !open && setConfirmPack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-secondary" />
              Confirm Purchase
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You're about to purchase the <strong>{confirmPack?.name}</strong>:</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="font-medium text-foreground">
                    {confirmPack?.credits} credits
                    {confirmPack?.bonusCredits ? ` + ${confirmPack.bonusCredits} bonus` : ""}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    ${confirmPack ? (confirmPack.priceCents / 100).toFixed(2) : 0}
                  </p>
                </div>
                <p className="text-sm">
                  Your purchase request will be submitted for approval. Credits will be added to your account once approved.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPurchase}
              disabled={purchaseLoading}
              className="bg-foreground text-background hover:bg-foreground/85"
            >
              {purchaseLoading ? "Processing..." : "Confirm Purchase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
