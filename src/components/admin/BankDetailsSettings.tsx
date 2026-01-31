import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBankSettings } from "@/hooks/use-bank-settings";
import { toast } from "sonner";
import { Building2, Loader2, Save } from "lucide-react";

export function BankDetailsSettings() {
  const { settings, loading, updateSettings } = useBankSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(formData);
    if (success) {
      toast.success("Bank details updated successfully");
    } else {
      toast.error("Failed to update bank details");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Bank Details
        </CardTitle>
        <CardDescription>
          Configure the bank account details shown to users during manual payment upgrades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="e.g., Chase Bank"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Holder Name</Label>
            <Input
              id="accountName"
              placeholder="e.g., Mexive Inc."
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 1234567890"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch Name</Label>
            <Input
              id="branch"
              placeholder="e.g., Main Street Branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="swiftCode">SWIFT/BIC Code (for international transfers)</Label>
          <Input
            id="swiftCode"
            placeholder="e.g., CHASUS33XXX"
            value={formData.swiftCode}
            onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentInstructions">Payment Instructions</Label>
          <Textarea
            id="paymentInstructions"
            placeholder="Additional instructions for users making payments..."
            value={formData.paymentInstructions}
            onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message will be shown to users when they're making a bank transfer.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Bank Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
