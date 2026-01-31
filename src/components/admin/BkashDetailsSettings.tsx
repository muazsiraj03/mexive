import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBkashSettings } from "@/hooks/use-bkash-settings";
import { toast } from "sonner";
import { Loader2, Save, Smartphone } from "lucide-react";

export function BkashDetailsSettings() {
  const { settings, loading, updateSettings } = useBkashSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(formData);
    if (success) {
      toast.success("bKash details updated successfully");
    } else {
      toast.error("Failed to update bKash details");
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
          <Smartphone className="h-5 w-5 text-[#E2136E]" />
          bKash Details
        </CardTitle>
        <CardDescription>
          Configure the bKash payment details shown to users during manual payment upgrades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="personalNumber">Personal Number</Label>
            <Input
              id="personalNumber"
              placeholder="e.g., 01XXXXXXXXX"
              value={formData.personalNumber}
              onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Send Money number</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="merchantNumber">Merchant Number</Label>
            <Input
              id="merchantNumber"
              placeholder="e.g., 01XXXXXXXXX"
              value={formData.merchantNumber}
              onChange={(e) => setFormData({ ...formData, merchantNumber: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Payment number</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentNumber">Agent Number</Label>
            <Input
              id="agentNumber"
              placeholder="e.g., 01XXXXXXXXX"
              value={formData.agentNumber}
              onChange={(e) => setFormData({ ...formData, agentNumber: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Cash Out number</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bkashPaymentInstructions">Payment Instructions</Label>
          <Textarea
            id="bkashPaymentInstructions"
            placeholder="Additional instructions for users making bKash payments..."
            value={formData.paymentInstructions}
            onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message will be shown to users when they're making a bKash payment.
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
                Save bKash Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
