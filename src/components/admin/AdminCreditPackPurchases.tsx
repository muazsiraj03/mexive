import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader } from "./AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  Package,
  User,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CreditPackPurchase {
  id: string;
  userId: string;
  packId: string | null;
  packName: string | null;
  credits: number;
  amount: number;
  status: string;
  senderName: string | null;
  senderAccount: string | null;
  transactionId: string | null;
  notes: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface UserInfo {
  full_name: string | null;
}

export function AdminCreditPackPurchases() {
  const { session } = useAuth();
  const [purchases, setPurchases] = useState<CreditPackPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CreditPackPurchase | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState<Record<string, UserInfo>>({});

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("credit_pack_purchases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPurchases(
        (data || []).map((p) => ({
          id: p.id,
          userId: p.user_id,
          packId: p.pack_id,
          packName: p.pack_name,
          credits: p.credits,
          amount: p.amount,
          status: p.status,
          senderName: p.sender_name,
          senderAccount: p.sender_account,
          transactionId: p.transaction_id,
          notes: p.notes,
          adminNotes: p.admin_notes,
          reviewedAt: p.reviewed_at,
          reviewedBy: p.reviewed_by,
          createdAt: p.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user info
  const fetchUserInfo = useCallback(async () => {
    const userIds = [...new Set(purchases.map(p => p.userId))];
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const infoMap: Record<string, UserInfo> = {};
    data?.forEach(profile => {
      infoMap[profile.user_id] = { full_name: profile.full_name };
    });
    setUserInfoMap(infoMap);
  }, [purchases]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    if (purchases.length > 0) {
      fetchUserInfo();
    }
  }, [purchases, fetchUserInfo]);

  const handleApprove = async () => {
    if (!selectedPurchase || !session) return;
    
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke("purchase-credits", {
        body: { action: "approve", purchaseId: selectedPurchase.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Failed to approve");
      }

      toast.success("Purchase approved - credits added to user");
      setShowApproveDialog(false);
      setSelectedPurchase(null);
      setAdminNotes("");
      fetchPurchases();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve purchase");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPurchase || !session) return;
    
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke("purchase-credits", {
        body: { action: "reject", purchaseId: selectedPurchase.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Failed to reject");
      }

      toast.success("Purchase rejected");
      setShowRejectDialog(false);
      setSelectedPurchase(null);
      setAdminNotes("");
      fetchPurchases();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject purchase");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = purchases.filter(p => p.status === "pending").length;

  if (loading) {
    return (
      <>
        <AdminHeader 
          title="Credit Pack Purchases" 
          description="Review and approve credit pack purchase requests" 
        />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader 
        title="Credit Pack Purchases" 
        description={`${pendingCount} pending purchase${pendingCount !== 1 ? 's' : ''} awaiting review`}
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Pending Purchases */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-yellow-500" />
                  Pending Purchases
                </CardTitle>
                <CardDescription>
                  Purchases waiting for payment verification
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPurchases} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {purchases.filter(p => p.status === "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending purchases</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Pack</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases
                        .filter(p => p.status === "pending")
                        .map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {userInfoMap[purchase.userId]?.full_name || "User"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {purchase.senderName || "—"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {purchase.packName || "Credit Pack"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{purchase.credits}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                ${(purchase.amount / 100).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {purchase.transactionId || "—"}
                              </code>
                            </TableCell>
                            <TableCell>
                              {format(new Date(purchase.createdAt), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPurchase(purchase)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedPurchase(purchase);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPurchase(purchase);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                Previously processed credit pack purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.filter(p => p.status !== "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No processed purchases yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Pack</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reviewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases
                        .filter(p => p.status !== "pending")
                        .map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <p className="font-medium text-sm">
                                {userInfoMap[purchase.userId]?.full_name || purchase.senderName || "User"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {purchase.packName || "Credit Pack"}
                              </Badge>
                            </TableCell>
                            <TableCell>{purchase.credits}</TableCell>
                            <TableCell>${(purchase.amount / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              {getStatusBadge(purchase.status)}
                            </TableCell>
                            <TableCell>
                              {purchase.reviewedAt ? format(new Date(purchase.reviewedAt), "MMM d, yyyy") : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Purchase Dialog */}
      <Dialog open={!!selectedPurchase && !showApproveDialog && !showRejectDialog} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pack:</span>
                  <Badge variant="secondary">{selectedPurchase.packName || "Credit Pack"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="font-medium">{selectedPurchase.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${(selectedPurchase.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{selectedPurchase.transactionId || "—"}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender Name:</span>
                  <span>{selectedPurchase.senderName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender Account:</span>
                  <span>{selectedPurchase.senderAccount || "—"}</span>
                </div>
                {selectedPurchase.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-1">Notes:</span>
                    <p className="text-sm">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPurchase(null)}>
              Close
            </Button>
            {selectedPurchase?.status === "pending" && (
              <>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowApproveDialog(true)}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Credit Pack Purchase</DialogTitle>
            <DialogDescription>
              This will add {selectedPurchase?.credits} credits to the user's account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApproveDialog(false);
                setAdminNotes("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve & Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Credit Pack Purchase</DialogTitle>
            <DialogDescription>
              The user will be notified that their purchase was not approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setAdminNotes("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
