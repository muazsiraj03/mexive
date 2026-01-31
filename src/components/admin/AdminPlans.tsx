import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Save,
  DollarSign,
  Loader2,
  RefreshCw,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  Trash2,
  Infinity as InfinityIcon,
  Star,
  Eye,
  EyeOff,
  Sparkles,
  Settings2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AdminHeader } from "./AdminHeader";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PricingPlan {
  id: string;
  plan_name: string;
  display_name: string;
  price_cents: number;
  credits: number;
  period: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  is_unlimited: boolean;
  sort_order: number;
  tools_access: string[];
  daily_credit_reset: boolean;
  isNew?: boolean;
}

const ALL_TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

interface CreditTier {
  id: string;
  plan_name: string;
  credits: number;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
  isNew?: boolean;
}

export function AdminPlans() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [creditTiers, setCreditTiers] = useState<CreditTier[]>([]);
  const [deletedTierIds, setDeletedTierIds] = useState<string[]>([]);
  const [deletedPlanIds, setDeletedPlanIds] = useState<string[]>([]);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CreditTier | null>(null);
  const [selectedPlanForTier, setSelectedPlanForTier] = useState<string>("");

  // Form state for plan dialog
  const [planForm, setPlanForm] = useState({
    plan_name: "",
    display_name: "",
    price_cents: 0,
    credits: 0,
    period: "/month",
    features: [""],
    is_popular: false,
    is_active: true,
    is_unlimited: false,
    sort_order: 0,
    tools_access: ["metadata-generator", "image-to-prompt", "file-reviewer"] as string[],
    daily_credit_reset: false,
  });

  // Form state for tier dialog
  const [tierForm, setTierForm] = useState({
    plan_name: "",
    credits: 100,
    price_cents: 1900,
    sort_order: 0,
    is_active: true,
  });

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const [pricingResult, tiersResult] = await Promise.all([
        supabase
          .from("pricing_config")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("credit_tiers")
          .select("*")
          .order("plan_name")
          .order("sort_order", { ascending: true }),
      ]);

      if (pricingResult.error) throw pricingResult.error;
      if (tiersResult.error) throw tiersResult.error;

      setPlans(pricingResult.data || []);
      setCreditTiers(tiersResult.data || []);
      setDeletedPlanIds([]);
      setDeletedTierIds([]);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      toast.error("Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  // Plan handlers
  const openPlanDialog = (plan?: PricingPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        plan_name: plan.plan_name,
        display_name: plan.display_name,
        price_cents: plan.price_cents,
        credits: plan.credits,
        period: plan.period || "/month",
        features: plan.features.length > 0 ? plan.features : [""],
        is_popular: plan.is_popular,
        is_active: plan.is_active,
        is_unlimited: plan.is_unlimited,
        sort_order: plan.sort_order,
        tools_access: plan.tools_access || ["metadata-generator", "image-to-prompt", "file-reviewer"],
        daily_credit_reset: plan.daily_credit_reset || false,
      });
    } else {
      setEditingPlan(null);
      const maxSortOrder = plans.reduce((max, p) => Math.max(max, p.sort_order), 0);
      setPlanForm({
        plan_name: "",
        display_name: "",
        price_cents: 1900,
        credits: 100,
        period: "/month",
        features: ["Feature 1"],
        is_popular: false,
        is_active: true,
        is_unlimited: false,
        sort_order: maxSortOrder + 1,
        tools_access: ["metadata-generator", "image-to-prompt", "file-reviewer"],
        daily_credit_reset: false,
      });
    }
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.plan_name.trim() || !planForm.display_name.trim()) {
      toast.error("Plan name and display name are required");
      return;
    }

    setSaving(true);
    try {
      const planData = {
        plan_name: planForm.plan_name.toLowerCase().replace(/\s+/g, "_"),
        display_name: planForm.display_name,
        price_cents: planForm.price_cents,
        credits: planForm.credits,
        period: planForm.period,
        features: planForm.features.filter((f) => f.trim() !== ""),
        is_popular: planForm.is_popular,
        is_active: planForm.is_active,
        is_unlimited: planForm.is_unlimited,
        sort_order: planForm.sort_order,
        tools_access: planForm.tools_access,
        daily_credit_reset: planForm.daily_credit_reset,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("pricing_config")
          .update(planData)
          .eq("id", editingPlan.id);
        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase.from("pricing_config").insert(planData);
        if (error) throw error;
        toast.success("Plan created successfully");
      }

      setPlanDialogOpen(false);
      await fetchPricing();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan. Check admin permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan: PricingPlan) => {
    try {
      // Delete associated tiers first
      const { error: tierError } = await supabase
        .from("credit_tiers")
        .delete()
        .eq("plan_name", plan.plan_name);
      if (tierError) throw tierError;

      const { error } = await supabase.from("pricing_config").delete().eq("id", plan.id);
      if (error) throw error;

      toast.success("Plan deleted successfully");
      setPlanToDelete(null);
      await fetchPricing();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const handleTogglePlanStatus = async (plan: PricingPlan) => {
    try {
      const { error } = await supabase
        .from("pricing_config")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);
      if (error) throw error;
      toast.success(`Plan ${!plan.is_active ? "activated" : "deactivated"}`);
      await fetchPricing();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast.error("Failed to update plan status");
    }
  };

  const handleMovePlan = async (plan: PricingPlan, direction: "up" | "down") => {
    const currentIndex = plans.findIndex((p) => p.id === plan.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= plans.length) return;

    const otherPlan = plans[newIndex];

    try {
      await Promise.all([
        supabase.from("pricing_config").update({ sort_order: otherPlan.sort_order }).eq("id", plan.id),
        supabase.from("pricing_config").update({ sort_order: plan.sort_order }).eq("id", otherPlan.id),
      ]);
      await fetchPricing();
    } catch (error) {
      console.error("Error reordering plans:", error);
      toast.error("Failed to reorder plans");
    }
  };

  // Tier handlers
  const openTierDialog = (planName: string, tier?: CreditTier) => {
    setSelectedPlanForTier(planName);
    if (tier) {
      setEditingTier(tier);
      setTierForm({
        plan_name: tier.plan_name,
        credits: tier.credits,
        price_cents: tier.price_cents,
        sort_order: tier.sort_order,
        is_active: tier.is_active,
      });
    } else {
      setEditingTier(null);
      const planTiers = creditTiers.filter((t) => t.plan_name === planName);
      const maxSortOrder = planTiers.reduce((max, t) => Math.max(max, t.sort_order), 0);
      setTierForm({
        plan_name: planName,
        credits: 100,
        price_cents: 1900,
        sort_order: maxSortOrder + 1,
        is_active: true,
      });
    }
    setTierDialogOpen(true);
  };

  const handleSaveTier = async () => {
    if (tierForm.credits <= 0 || tierForm.price_cents <= 0) {
      toast.error("Credits and price must be greater than 0");
      return;
    }

    setSavingTiers(true);
    try {
      const tierData = {
        plan_name: selectedPlanForTier,
        credits: tierForm.credits,
        price_cents: tierForm.price_cents,
        sort_order: tierForm.sort_order,
        is_active: tierForm.is_active,
      };

      if (editingTier) {
        const { error } = await supabase.from("credit_tiers").update(tierData).eq("id", editingTier.id);
        if (error) throw error;
        toast.success("Credit tier updated");
      } else {
        const { error } = await supabase.from("credit_tiers").insert(tierData);
        if (error) throw error;
        toast.success("Credit tier created");
      }

      setTierDialogOpen(false);
      await fetchPricing();
    } catch (error) {
      console.error("Error saving tier:", error);
      toast.error("Failed to save credit tier");
    } finally {
      setSavingTiers(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    try {
      const { error } = await supabase.from("credit_tiers").delete().eq("id", tierId);
      if (error) throw error;
      toast.success("Credit tier deleted");
      await fetchPricing();
    } catch (error) {
      console.error("Error deleting tier:", error);
      toast.error("Failed to delete credit tier");
    }
  };

  const paidPlansWithTiers = plans.filter((p) => p.plan_name !== "free" && !p.is_unlimited);

  if (loading) {
    return (
      <>
        <AdminHeader title="Pricing Plans" description="Manage subscription plans and credit tiers" />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Pricing Plans" description="Manage subscription plans and credit tiers" />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
              <p className="text-xs text-muted-foreground">{plans.filter((p) => p.is_active).length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credit Tiers</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditTiers.length}</div>
              <p className="text-xs text-muted-foreground">
                Across {paidPlansWithTiers.length} plan{paidPlansWithTiers.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Popular Plan</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.find((p) => p.is_popular)?.display_name || "None"}</div>
              <p className="text-xs text-muted-foreground">Highlighted on pricing page</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unlimited Plans</CardTitle>
              <InfinityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter((p) => p.is_unlimited).length}</div>
              <p className="text-xs text-muted-foreground">No credit limits</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="plans" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Plans ({plans.length})
              </TabsTrigger>
              <TabsTrigger value="tiers" className="gap-2">
                <Layers className="h-4 w-4" />
                Credit Tiers ({creditTiers.length})
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={fetchPricing} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Subscription Plans
                    </CardTitle>
                    <CardDescription>Plans are displayed on your landing page and dashboard</CardDescription>
                  </div>
                  <Button onClick={() => openPlanDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Order</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Tools</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan, index) => (
                      <TableRow key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMovePlan(plan, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMovePlan(plan, "down")}
                              disabled={index === plans.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{plan.display_name}</span>
                                {plan.is_popular && (
                                  <Badge variant="default" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                                {plan.is_unlimited && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <InfinityIcon className="h-3 w-3" />
                                    Unlimited
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{plan.plan_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">${(plan.price_cents / 100).toFixed(0)}</span>
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        </TableCell>
                        <TableCell>
                          {plan.is_unlimited ? (
                            <Badge variant="outline" className="gap-1">
                              <InfinityIcon className="h-3 w-3" />
                              Unlimited
                            </Badge>
                          ) : (
                            <span>{plan.credits.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(plan.tools_access || []).length === 3 ? (
                              <Badge variant="outline" className="text-xs">All Tools</Badge>
                            ) : (plan.tools_access || []).length === 0 ? (
                              <span className="text-xs text-muted-foreground">None</span>
                            ) : (
                              (plan.tools_access || []).map((tool) => (
                                <Badge key={tool} variant="secondary" className="text-xs">
                                  {tool.split("-").map(w => w[0].toUpperCase()).join("")}
                                </Badge>
                              ))
                            )}
                            {plan.daily_credit_reset && (
                              <Badge variant="outline" className="text-xs text-primary border-primary/30">Daily</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePlanStatus(plan)}
                            className={plan.is_active ? "text-primary" : "text-muted-foreground"}
                          >
                            {plan.is_active ? (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Hidden
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openPlanDialog(plan)}>
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPlanToDelete(plan)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Tiers Tab */}
          <TabsContent value="tiers" className="space-y-4">
            {paidPlansWithTiers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Paid Plans</h3>
                  <p className="text-muted-foreground">
                    Create a paid plan first to configure credit tiers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              paidPlansWithTiers.map((plan) => {
                const planTiers = creditTiers.filter((t) => t.plan_name === plan.plan_name);
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.display_name} Credit Tiers
                            <Badge variant="outline">{planTiers.length} tiers</Badge>
                          </CardTitle>
                          <CardDescription>
                            Different credit/price options for {plan.display_name} subscribers
                          </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => openTierDialog(plan.plan_name)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Tier
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {planTiers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No tiers configured. Add a tier to allow credit customization.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Credits</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Per Credit</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planTiers
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((tier) => (
                                <TableRow key={tier.id}>
                                  <TableCell className="font-medium">{tier.credits.toLocaleString()} credits</TableCell>
                                  <TableCell>${(tier.price_cents / 100).toFixed(0)}/mo</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    ${(tier.price_cents / 100 / tier.credits).toFixed(3)}/credit
                                  </TableCell>
                                  <TableCell>
                                    {tier.is_active ? (
                                      <Badge variant="outline" className="text-primary border-primary/30">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Active
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Inactive
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openTierDialog(plan.plan_name, tier)}
                                      >
                                        <Settings2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTier(tier.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Plan Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              <DialogDescription>
                {editingPlan ? "Update the plan details below" : "Configure your new subscription plan"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name (internal) *</Label>
                  <Input
                    value={planForm.plan_name}
                    onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
                    placeholder="e.g., pro"
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    value={planForm.display_name}
                    onChange={(e) => setPlanForm({ ...planForm, display_name: e.target.value })}
                    placeholder="e.g., Pro"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={planForm.price_cents / 100 || ""}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={planForm.credits || ""}
                    onChange={(e) => setPlanForm({ ...planForm, credits: parseInt(e.target.value) || 0 })}
                    disabled={planForm.is_unlimited}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Input
                    value={planForm.period}
                    onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })}
                    placeholder="/month"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={planForm.features.join("\n")}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split("\n") })}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={5}
                />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.is_active}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.is_popular}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, is_popular: checked })}
                  />
                  <Label>Mark as Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.is_unlimited}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, is_unlimited: checked })}
                  />
                  <Label>Unlimited Credits</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={planForm.daily_credit_reset}
                    onCheckedChange={(checked) => setPlanForm({ ...planForm, daily_credit_reset: checked })}
                  />
                  <Label>Daily Credit Reset</Label>
                </div>
              </div>
              
              {/* Tool Access Section */}
              <div className="space-y-3 border-t pt-4 mt-4">
                <Label className="text-base font-semibold">Tool Access</Label>
                <p className="text-sm text-muted-foreground">Select which tools this plan has access to</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ALL_TOOLS.map((tool) => (
                    <div 
                      key={tool.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        planForm.tools_access.includes(tool.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                      onClick={() => {
                        const newAccess = planForm.tools_access.includes(tool.id)
                          ? planForm.tools_access.filter(t => t !== tool.id)
                          : [...planForm.tools_access, tool.id];
                        setPlanForm({ ...planForm, tools_access: newAccess });
                      }}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        planForm.tools_access.includes(tool.id) 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground/50"
                      }`}>
                        {planForm.tools_access.includes(tool.id) && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{tool.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tier Dialog */}
        <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTier ? "Edit Credit Tier" : "Add Credit Tier"}</DialogTitle>
              <DialogDescription>
                Configure credit tier for {selectedPlanForTier}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credits *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tierForm.credits || ""}
                    onChange={(e) => setTierForm({ ...tierForm, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={tierForm.price_cents / 100 || ""}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={tierForm.is_active}
                  onCheckedChange={(checked) => setTierForm({ ...tierForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTier} disabled={savingTiers}>
                {savingTiers && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTier ? "Update Tier" : "Add Tier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Plan Confirmation */}
        <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the <strong>{planToDelete?.display_name}</strong> plan and all its credit
                tiers. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => planToDelete && handleDeletePlan(planToDelete)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  );
}
