import { useState } from "react";
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
import { PlanInfo } from "@/hooks/use-subscription";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { Check, Infinity } from "lucide-react";

interface ExtendedPlanInfo extends PlanInfo {
  selectedCredits?: number;
  selectedPrice?: number;
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExtendedPlanInfo | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function UpgradeDialog({ 
  open, 
  onOpenChange, 
  plan,
  onConfirm,
  loading 
}: UpgradeDialogProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!plan) return null;

  // Use selected tier values or fall back to plan defaults
  const isUnlimited = plan.name === "unlimited";
  const displayCredits = plan.selectedCredits ?? plan.credits;
  const displayPrice = plan.selectedPrice ?? plan.price;

  const handleProceedToPayment = () => {
    onOpenChange(false);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    onConfirm();
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade to {plan.displayName}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You're about to upgrade to the <strong>{plan.displayName}</strong> plan
                  {isUnlimited ? (
                    <> with <strong className="inline-flex items-center gap-1"><Infinity className="w-4 h-4" /> unlimited credits</strong> at <strong>${displayPrice}</strong>{plan.period}.</>
                  ) : (
                    <> with <strong>{displayCredits} credits/month</strong> at <strong>${displayPrice}</strong>{plan.period}.</>
                  )}
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-2">What you'll get:</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">
                  You'll be shown bank transfer details to complete your payment. Once verified, your subscription will be activated.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProceedToPayment}
              disabled={loading}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Proceed to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentFormDialog
        open={showPaymentForm}
        onOpenChange={setShowPaymentForm}
        plan={plan}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
