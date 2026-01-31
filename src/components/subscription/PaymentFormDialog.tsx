import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBankSettings } from "@/hooks/use-bank-settings";
import { useUpgradeRequests } from "@/hooks/use-upgrade-requests";
import { PlanInfo } from "@/hooks/use-subscription";
import { 
  Loader2, 
  Copy, 
  Check, 
  Building2, 
  CreditCard, 
  User, 
  MapPin, 
  Globe,
  Infinity
} from "lucide-react";
import { toast } from "sonner";

interface ExtendedPlanInfo extends PlanInfo {
  selectedCredits?: number;
  selectedPrice?: number;
}

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExtendedPlanInfo | null;
  onSuccess: () => void;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: PaymentFormDialogProps) {
  const { settings: bankSettings, loading: bankLoading } = useBankSettings();
  const { createRequest, actionLoading } = useUpgradeRequests();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [notes, setNotes] = useState("");

  if (!plan) return null;

  const isUnlimited = plan.name === "unlimited";
  const displayCredits = plan.selectedCredits ?? plan.credits;
  const displayPrice = plan.selectedPrice ?? plan.price;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      toast.error("Please enter the transaction/reference ID");
      return;
    }

    const result = await createRequest({
      planName: plan.name,
      requestedCredits: plan.selectedCredits,
      requestedPriceCents: plan.selectedPrice ? plan.selectedPrice * 100 : undefined,
      transactionId: transactionId.trim(),
      paymentDate: paymentDate || undefined,
      senderName: senderName.trim() || undefined,
      senderAccount: senderAccount.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      // Reset form
      setTransactionId("");
      setPaymentDate("");
      setSenderName("");
      setSenderAccount("");
      setNotes("");
      onSuccess();
      onOpenChange(false);
    }
  };

  const BankDetailRow = ({
    icon: Icon,
    label,
    value,
    fieldKey,
  }: {
    icon: any;
    label: string;
    value: string;
    fieldKey: string;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{value || "—"}</span>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => handleCopy(value, fieldKey)}
        >
          {copiedField === fieldKey ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade to {plan.displayName}</DialogTitle>
          <DialogDescription>
            Transfer the amount below and fill in your payment details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount to Pay */}
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-primary">${displayPrice}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isUnlimited ? (
                <span className="flex items-center justify-center gap-1">
                  <Infinity className="h-4 w-4" /> Unlimited credits
                </span>
              ) : (
                `${displayCredits} credits/month`
              )}
            </p>
          </div>

          {/* Bank Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Bank Transfer Details</h4>
            {bankLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-3">
                <BankDetailRow
                  icon={Building2}
                  label="Bank"
                  value={bankSettings.bankName}
                  fieldKey="bank"
                />
                <BankDetailRow
                  icon={User}
                  label="Account Name"
                  value={bankSettings.accountName}
                  fieldKey="accountName"
                />
                <BankDetailRow
                  icon={CreditCard}
                  label="Account Number"
                  value={bankSettings.accountNumber}
                  fieldKey="accountNumber"
                />
                <BankDetailRow
                  icon={MapPin}
                  label="Branch"
                  value={bankSettings.branch}
                  fieldKey="branch"
                />
                {bankSettings.swiftCode && (
                  <BankDetailRow
                    icon={Globe}
                    label="SWIFT/BIC"
                    value={bankSettings.swiftCode}
                    fieldKey="swift"
                  />
                )}
              </div>
            )}
            {bankSettings.paymentInstructions && (
              <p className="text-xs text-muted-foreground mt-2">
                {bankSettings.paymentInstructions}
              </p>
            )}
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Your Payment Details</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction/Reference ID *</Label>
                <Input
                  id="transactionId"
                  placeholder="e.g., TXN123456789"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="senderName">Your Name (as on bank)</Label>
                <Input
                  id="senderName"
                  placeholder="John Doe"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderAccount">Your Account (last 4 digits)</Label>
                <Input
                  id="senderAccount"
                  placeholder="1234"
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Payment Details"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
