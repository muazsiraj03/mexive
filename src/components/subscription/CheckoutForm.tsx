import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBankSettings } from "@/hooks/use-bank-settings";
import { useUpgradeRequests } from "@/hooks/use-upgrade-requests";
import { useAuth } from "@/hooks/use-auth";
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
  Infinity,
  ShoppingCart,
  Receipt,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface ExtendedPlanInfo extends PlanInfo {
  selectedCredits?: number;
  selectedPrice?: number;
}

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExtendedPlanInfo | null;
  onSuccess: () => void;
}

export function CheckoutForm({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: CheckoutFormProps) {
  const { user } = useAuth();
  const { settings: bankSettings, loading: bankLoading } = useBankSettings();
  const { createRequest, actionLoading } = useUpgradeRequests();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [step, setStep] = useState<"checkout" | "success">("checkout");

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");

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

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    const result = await createRequest({
      planName: plan.name,
      requestedCredits: plan.selectedCredits,
      requestedPriceCents: plan.selectedPrice ? plan.selectedPrice * 100 : undefined,
      transactionId: transactionId.trim() || undefined,
      senderName: fullName.trim(),
      senderAccount: phone.trim() || undefined,
      notes: `Email: ${user?.email || "N/A"}`,
    });

    if (result.success) {
      setStep("success");
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onSuccess();
    }
    setStep("checkout");
    setFullName("");
    setPhone("");
    setTransactionId("");
    onOpenChange(false);
  };

  const CopyButton = ({ value, fieldKey }: { value: string; fieldKey: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 shrink-0"
      onClick={() => handleCopy(value, fieldKey)}
    >
      {copiedField === fieldKey ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {step === "checkout" ? (
          <>
            {/* Header */}
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Checkout
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-0">
              {/* Order Summary */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Order Summary</h3>
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{plan.displayName} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {isUnlimited ? (
                          <span className="flex items-center gap-1">
                            <Infinity className="h-3.5 w-3.5" /> Unlimited credits/month
                          </span>
                        ) : (
                          `${displayCredits} credits/month`
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${displayPrice}</p>
                      <p className="text-xs text-muted-foreground">{plan.period}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${displayPrice}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span className="text-lg text-primary">${displayPrice}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Billing Information */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Billing Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              {/* Payment Method - Bank Transfer */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Method</h3>
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Bank Transfer</span>
                  </div>

                  {bankLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Bank Name</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{bankSettings.bankName || "—"}</span>
                          {bankSettings.bankName && <CopyButton value={bankSettings.bankName} fieldKey="bank" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Account Name</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{bankSettings.accountName || "—"}</span>
                          {bankSettings.accountName && <CopyButton value={bankSettings.accountName} fieldKey="name" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Account Number</span>
                        <div className="flex items-center gap-1">
                          <code className="font-mono font-medium bg-muted px-2 py-0.5 rounded">
                            {bankSettings.accountNumber || "—"}
                          </code>
                          {bankSettings.accountNumber && <CopyButton value={bankSettings.accountNumber} fieldKey="number" />}
                        </div>
                      </div>
                      {bankSettings.branch && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Branch</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{bankSettings.branch}</span>
                            <CopyButton value={bankSettings.branch} fieldKey="branch" />
                          </div>
                        </div>
                      )}
                      {bankSettings.swiftCode && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-muted-foreground">SWIFT/BIC</span>
                          <div className="flex items-center gap-1">
                            <code className="font-mono font-medium">{bankSettings.swiftCode}</code>
                            <CopyButton value={bankSettings.swiftCode} fieldKey="swift" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {bankSettings.paymentInstructions && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      {bankSettings.paymentInstructions}
                    </p>
                  )}
                </div>

                {/* Optional: Transaction ID if already paid */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="transactionId" className="text-muted-foreground">
                    Transaction/Reference ID (if already paid)
                  </Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter if you've completed the transfer"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="p-6 pt-2 bg-muted/30 border-t">
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-12 text-base rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5 mr-2" />
                      Place Order - ${displayPrice}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Your order will be activated after payment verification
                </p>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Order Placed Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Your upgrade request has been submitted. Please complete the bank transfer of <strong>${displayPrice}</strong> to activate your subscription.
            </p>
            
            <div className="rounded-lg bg-muted/50 p-4 text-left text-sm mb-6">
              <p className="font-medium mb-2">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Transfer ${displayPrice} to the bank account shown above</li>
                <li>Use your email as payment reference</li>
                <li>We'll verify and activate your subscription within 24 hours</li>
              </ol>
            </div>

            <Button onClick={handleClose} className="rounded-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
