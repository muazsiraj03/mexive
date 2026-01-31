import { useState } from "react";
import { usePromoCodes, PromoCode, PromoCodeFormData } from "@/hooks/use-promo-codes";
import { usePricing } from "@/hooks/use-pricing";
import { AdminHeader } from "./AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Percent, DollarSign, Tag } from "lucide-react";
import { format } from "date-fns";

export function AdminPromoCodes() {
  const { promoCodes, loading, createPromoCode, updatePromoCode, deletePromoCode } = usePromoCodes();
  const { plans } = usePricing();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: null,
    min_purchase_cents: 0,
    applicable_plans: [],
    is_active: true,
    expires_at: null,
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: null,
      min_purchase_cents: 0,
      applicable_plans: [],
      is_active: true,
      expires_at: null,
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    const success = await createPromoCode(formData);
    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingPromo) return;
    setSaving(true);
    const success = await updatePromoCode(editingPromo.id, formData);
    if (success) {
      setEditingPromo(null);
      resetForm();
    }
    setSaving(false);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_uses: promo.max_uses,
      min_purchase_cents: promo.min_purchase_cents,
      applicable_plans: promo.applicable_plans,
      is_active: promo.is_active,
      expires_at: promo.expires_at,
    });
  };

  const handleDelete = async (id: string) => {
    await deletePromoCode(id);
  };

  const handleToggleActive = async (promo: PromoCode) => {
    await updatePromoCode(promo.id, { is_active: !promo.is_active });
  };

  const activePlans = plans.filter(p => p.isActive && p.plan_name !== "free");

  const togglePlan = (planName: string) => {
    const current = formData.applicable_plans || [];
    if (current.includes(planName)) {
      setFormData({ ...formData, applicable_plans: current.filter(p => p !== planName) });
    } else {
      setFormData({ ...formData, applicable_plans: [...current, planName] });
    }
  };

  const PromoForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Promo Code</Label>
          <Input
            id="code"
            placeholder="SUMMER20"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(v: "percentage" | "fixed") => setFormData({ ...formData, discount_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_value">
            Discount Value {formData.discount_type === "percentage" ? "(%)" : "(cents)"}
          </Label>
          <Input
            id="discount_value"
            type="number"
            min="0"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_uses">Max Uses (optional)</Label>
          <Input
            id="max_uses"
            type="number"
            min="0"
            placeholder="Unlimited"
            value={formData.max_uses || ""}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="Summer sale discount"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_purchase">Min Purchase (cents)</Label>
          <Input
            id="min_purchase"
            type="number"
            min="0"
            value={formData.min_purchase_cents}
            onChange={(e) => setFormData({ ...formData, min_purchase_cents: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires_at">Expires At (optional)</Label>
          <Input
            id="expires_at"
            type="datetime-local"
            value={formData.expires_at ? formData.expires_at.slice(0, 16) : ""}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </div>
      </div>

      {/* Applicable Plans */}
      <div className="space-y-2">
        <Label>Applicable Plans</Label>
        <p className="text-xs text-muted-foreground">Leave empty to apply to all plans</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {activePlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-2">
              <Checkbox
                id={`plan-${plan.id}`}
                checked={(formData.applicable_plans || []).includes(plan.plan_name)}
                onCheckedChange={() => togglePlan(plan.plan_name)}
              />
              <Label htmlFor={`plan-${plan.id}`} className="text-sm font-normal cursor-pointer">
                {plan.displayName}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active</Label>
      </div>

      <DialogFooter>
        <Button onClick={onSubmit} disabled={saving || !formData.code}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  if (loading) {
    return (
      <>
        <AdminHeader title="Promo Codes" description="Manage discount codes for checkout" />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Promo Codes" description="Manage discount codes for checkout" />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Total Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{promoCodes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {promoCodes.filter(p => p.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {promoCodes.reduce((sum, p) => sum + p.current_uses, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Promo Codes Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Promo Codes</CardTitle>
                <CardDescription>Create and manage discount codes</CardDescription>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Code
                  </Button>
                </DialogTrigger>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>Create Promo Code</DialogTitle>
                    <DialogDescription>Add a new discount code for checkout</DialogDescription>
                  </DialogHeader>
                  <PromoForm onSubmit={handleCreate} submitLabel="Create" />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No promo codes yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Plans</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div className="font-mono font-medium">{promo.code}</div>
                          {promo.description && (
                            <div className="text-xs text-muted-foreground">{promo.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {promo.discount_type === "percentage" ? (
                              <>
                                <Percent className="h-3 w-3" />
                                {promo.discount_value}%
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-3 w-3" />
                                {(promo.discount_value / 100).toFixed(2)}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {promo.applicable_plans && promo.applicable_plans.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {promo.applicable_plans.map((plan) => (
                                <Badge key={plan} variant="outline" className="text-xs">
                                  {plan}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">All plans</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {promo.current_uses}
                          {promo.max_uses && ` / ${promo.max_uses}`}
                        </TableCell>
                        <TableCell>
                          {promo.expires_at
                            ? format(new Date(promo.expires_at), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={promo.is_active}
                            onCheckedChange={() => handleToggleActive(promo)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={editingPromo?.id === promo.id} onOpenChange={(open) => !open && setEditingPromo(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(promo)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                                <DialogHeader>
                                  <DialogTitle>Edit Promo Code</DialogTitle>
                                  <DialogDescription>Update the discount code settings</DialogDescription>
                                </DialogHeader>
                                <PromoForm onSubmit={handleUpdate} submitLabel="Save Changes" />
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{promo.code}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(promo.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
