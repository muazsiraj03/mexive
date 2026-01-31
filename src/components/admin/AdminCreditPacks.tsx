import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Clock,
  Check,
  X,
  Star,
  Coins,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
  Settings2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminHeader } from "./AdminHeader";

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  bonus_credits: number | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
}

interface PendingPurchase {
  id: string;
  user_id: string;
  credits: number;
  amount: number;
  status: string | null;
  created_at: string | null;
  sender_name: string | null;
  notes: string | null;
  pack_name: string | null;
}

export function AdminCreditPacks() {
  const { session } = useAuth();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<CreditPack | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packToDelete, setPackToDelete] = useState<CreditPack | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    credits: 100,
    price_cents: 999,
    bonus_credits: 0,
    is_popular: false,
    is_active: true,
    sort_order: 0,
  });

  const fetchPacks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPacks(data || []);
    } catch (error) {
      console.error("Error fetching packs:", error);
      toast.error("Failed to load credit packs");
    }
  }, []);

  const fetchPendingPurchases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("credit_pack_purchases")
        .select("id, user_id, credits, amount, status, created_at, sender_name, notes, pack_name")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingPurchases(data || []);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPacks(), fetchPendingPurchases()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPacks, fetchPendingPurchases]);

  const openDialog = (pack?: CreditPack) => {
    if (pack) {
      setEditingPack(pack);
      setFormData({
        name: pack.name,
        credits: pack.credits,
        price_cents: pack.price_cents,
        bonus_credits: pack.bonus_credits || 0,
        is_popular: pack.is_popular || false,
        is_active: pack.is_active ?? true,
        sort_order: pack.sort_order || 0,
      });
    } else {
      setEditingPack(null);
      const maxSortOrder = packs.reduce((max, p) => Math.max(max, p.sort_order || 0), 0);
      setFormData({
        name: "",
        credits: 100,
        price_cents: 999,
        bonus_credits: 0,
        is_popular: false,
        is_active: true,
        sort_order: maxSortOrder + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Pack name is required");
      return;
    }
    if (formData.credits <= 0) {
      toast.error("Credits must be greater than 0");
      return;
    }
    if (formData.price_cents <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setActionLoading("save");
    try {
      const packData = {
        name: formData.name.trim(),
        credits: formData.credits,
        price_cents: formData.price_cents,
        bonus_credits: formData.bonus_credits,
        is_popular: formData.is_popular,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingPack) {
        const { error } = await supabase.from("credit_packs").update(packData).eq("id", editingPack.id);
        if (error) throw error;
        toast.success("Credit pack updated");
      } else {
        const { error } = await supabase.from("credit_packs").insert(packData);
        if (error) throw error;
        toast.success("Credit pack created");
      }

      setDialogOpen(false);
      await fetchPacks();
    } catch (error) {
      console.error("Error saving pack:", error);
      toast.error("Failed to save credit pack. Check admin permissions.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!packToDelete) return;

    setActionLoading(packToDelete.id);
    try {
      const { error } = await supabase.from("credit_packs").delete().eq("id", packToDelete.id);
      if (error) throw error;
      toast.success("Credit pack deleted");
      setDeleteDialogOpen(false);
      setPackToDelete(null);
      await fetchPacks();
    } catch (error) {
      console.error("Error deleting pack:", error);
      toast.error("Failed to delete credit pack");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (pack: CreditPack) => {
    try {
      const { error } = await supabase.from("credit_packs").update({ is_active: !pack.is_active }).eq("id", pack.id);
      if (error) throw error;
      toast.success(`Pack ${!pack.is_active ? "activated" : "deactivated"}`);
      await fetchPacks();
    } catch (error) {
      console.error("Error toggling pack status:", error);
      toast.error("Failed to update pack status");
    }
  };

  const handlePurchaseAction = async (purchaseId: string, action: "approve" | "reject") => {
    setActionLoading(purchaseId);
    try {
      const response = await supabase.functions.invoke("purchase-credits", {
        body: { action, purchaseId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (response.error || response.data?.error) {
        throw new Error(response.error?.message || response.data?.error);
      }

      toast.success(`Purchase ${action === "approve" ? "approved" : "rejected"}`);
      await fetchPendingPurchases();
    } catch (error) {
      console.error(`Error ${action}ing purchase:`, error);
      toast.error(`Failed to ${action} purchase`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const totalCreditsValue = packs.reduce((sum, p) => sum + (p.credits + (p.bonus_credits || 0)), 0);
  const activePacks = packs.filter((p) => p.is_active);
  const popularPack = packs.find((p) => p.is_popular);

  if (loading) {
    return (
      <>
        <AdminHeader title="Credit Packs" description="Manage credit pack options and approve purchases" />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Credit Packs" description="Manage credit pack options and approve purchases" />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {!settingsLoading && !settings.enableCreditPacks && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Credit Packs Disabled</AlertTitle>
            <AlertDescription>
              Credit packs are currently disabled and hidden from users. You can enable them in{" "}
              <a href="/admin/settings" className="font-medium underline underline-offset-2 hover:text-destructive">
                Admin Settings
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              <Package className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packs.length}</div>
              <p className="text-xs text-muted-foreground">{activePacks.length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Purchases</CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pendingPurchases.length > 0 ? "text-warning" : ""}`}>
                {pendingPurchases.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingPurchases.length > 0 ? "Awaiting review" : "All clear"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Popular Pack</CardTitle>
              <Star className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{popularPack?.name || "None"}</div>
              <p className="text-xs text-muted-foreground">Highlighted to users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credit Range</CardTitle>
              <Coins className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {packs.length > 0
                  ? `${Math.min(...packs.map((p) => p.credits))}-${Math.max(...packs.map((p) => p.credits))}`
                  : "0"}
              </div>
              <p className="text-xs text-muted-foreground">Min-max credits</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="packs">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="packs" className="gap-2">
                <Package className="h-4 w-4" />
                Packs ({packs.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 relative">
                <Clock className="h-4 w-4" />
                Pending ({pendingPurchases.length})
                {pendingPurchases.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
                    {pendingPurchases.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={() => Promise.all([fetchPacks(), fetchPendingPurchases()])}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Packs Tab */}
          <TabsContent value="packs" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Credit Pack Options</CardTitle>
                  <CardDescription>Configure available credit packs for users to purchase</CardDescription>
                </div>
                <Button onClick={() => openDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Pack
                </Button>
              </CardHeader>
              <CardContent>
                {packs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No credit packs configured</p>
                    <p className="text-sm">Add your first credit pack to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pack</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Per Credit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packs.map((pack) => (
                        <TableRow key={pack.id} className={!pack.is_active ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pack.name}</span>
                              {pack.is_popular && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <Star className="h-3 w-3" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{pack.credits.toLocaleString()}</TableCell>
                          <TableCell>
                            {pack.bonus_credits && pack.bonus_credits > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                +{pack.bonus_credits.toLocaleString()}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{formatPrice(pack.price_cents)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            ${(pack.price_cents / 100 / (pack.credits + (pack.bonus_credits || 0))).toFixed(3)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(pack)}
                              className={pack.is_active ? "text-primary" : "text-muted-foreground"}
                            >
                              {pack.is_active ? (
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
                              <Button variant="ghost" size="icon" onClick={() => openDialog(pack)}>
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setPackToDelete(pack);
                                  setDeleteDialogOpen(true);
                                }}
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
          </TabsContent>

          {/* Pending Purchases Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card className={pendingPurchases.length > 0 ? "border-warning/30" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${pendingPurchases.length > 0 ? "text-warning" : "text-muted-foreground"}`} />
                  <div>
                    <CardTitle>Pending Purchases</CardTitle>
                    <CardDescription>
                      {pendingPurchases.length > 0
                        ? `${pendingPurchases.length} purchase${pendingPurchases.length !== 1 ? "s" : ""} awaiting approval`
                        : "No pending purchases"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pendingPurchases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">All caught up!</h3>
                    <p className="text-muted-foreground mt-1">No pending purchase requests</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-muted">
                                  {purchase.sender_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{purchase.sender_name || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground">{purchase.pack_name || `ID: ${purchase.user_id.slice(0, 8)}...`}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{purchase.credits.toLocaleString()} credits</TableCell>
                          <TableCell className="font-semibold">${(purchase.amount / 100).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {purchase.created_at ? format(new Date(purchase.created_at), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePurchaseAction(purchase.id, "approve")}
                                disabled={actionLoading === purchase.id}
                                className="gap-1.5"
                              >
                                {actionLoading === purchase.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePurchaseAction(purchase.id, "reject")}
                                disabled={actionLoading === purchase.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                              >
                                <X className="h-4 w-4" />
                                Reject
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
          </TabsContent>
        </Tabs>

        {/* Pack Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPack ? "Edit Credit Pack" : "Create Credit Pack"}</DialogTitle>
              <DialogDescription>
                {editingPack ? "Update the credit pack details" : "Add a new credit pack option for users"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pack Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter Pack"
                  maxLength={50}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credits *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.credits || ""}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Credits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.bonus_credits || ""}
                    onChange={(e) => setFormData({ ...formData, bonus_credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price_cents ? (formData.price_cents / 100).toFixed(2) : ""}
                    onChange={(e) =>
                      setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sort_order || ""}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label>Mark as Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={actionLoading === "save"}>
                {actionLoading === "save" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPack ? "Update Pack" : "Create Pack"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Credit Pack?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the <strong>{packToDelete?.name}</strong> credit pack. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                {actionLoading === packToDelete?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Pack
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  );
}
