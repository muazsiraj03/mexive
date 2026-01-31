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
import { useUpgradeRequests, UpgradeRequest } from "@/hooks/use-upgrade-requests";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  ExternalLink,
  Calendar,
  CreditCard,
  User
} from "lucide-react";
import { format } from "date-fns";

interface UserInfo {
  email: string;
  full_name: string | null;
}

export function AdminUpgradeRequests() {
  const { requests, loading, actionLoading, approveRequest, rejectRequest, refresh } = useUpgradeRequests();
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState<Record<string, UserInfo>>({});

  // Fetch user info for all requests
  const fetchUserInfo = useCallback(async () => {
    const userIds = [...new Set(requests.map(r => r.userId))];
    if (userIds.length === 0) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    if (error) {
      console.error("Error fetching user info:", error);
      return;
    }

    // Also get emails from auth (via admin API or stored in profiles)
    const infoMap: Record<string, UserInfo> = {};
    data?.forEach(profile => {
      infoMap[profile.user_id] = {
        email: "", // We'll need to get this separately
        full_name: profile.full_name,
      };
    });

    setUserInfoMap(infoMap);
  }, [requests]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    const result = await approveRequest(selectedRequest.id, adminNotes);
    if (result.success) {
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setAdminNotes("");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const result = await rejectRequest(selectedRequest.id, adminNotes);
    if (result.success) {
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setAdminNotes("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <>
        <AdminHeader 
          title="Upgrade Requests" 
          description="Review and approve manual payment upgrade requests" 
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
        title="Upgrade Requests" 
        description={`${pendingCount} pending request${pendingCount !== 1 ? 's' : ''} awaiting review`}
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Requests
              </CardTitle>
              <CardDescription>
                Requests waiting for payment verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.filter(r => r.status === "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests
                        .filter(r => r.status === "pending")
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {userInfoMap[request.userId]?.full_name || "User"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {request.senderName || "—"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {request.planName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                ${request.requestedPriceCents ? (request.requestedPriceCents / 100).toFixed(2) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {request.transactionId || "—"}
                              </code>
                            </TableCell>
                            <TableCell>
                              {request.paymentDate ? format(new Date(request.paymentDate), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell>
                              {format(new Date(request.createdAt), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedRequest(request);
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
                                    setSelectedRequest(request);
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

          {/* Request History */}
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                Previously processed upgrade requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.filter(r => r.status !== "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No processed requests yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reviewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests
                        .filter(r => r.status !== "pending")
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <p className="font-medium text-sm">
                                {userInfoMap[request.userId]?.full_name || request.senderName || "User"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {request.planName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ${request.requestedPriceCents ? (request.requestedPriceCents / 100).toFixed(2) : "—"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                            <TableCell>
                              {request.reviewedAt ? format(new Date(request.reviewedAt), "MMM d, yyyy") : "—"}
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

      {/* View Request Dialog */}
      <Dialog open={!!selectedRequest && !showApproveDialog && !showRejectDialog} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="secondary" className="capitalize">{selectedRequest.planName}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    ${selectedRequest.requestedPriceCents ? (selectedRequest.requestedPriceCents / 100).toFixed(2) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits:</span>
                  <span>{selectedRequest.requestedCredits || "Default"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{selectedRequest.transactionId || "—"}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{selectedRequest.paymentDate ? format(new Date(selectedRequest.paymentDate), "MMM d, yyyy") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender Name:</span>
                  <span>{selectedRequest.senderName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender Account:</span>
                  <span>{selectedRequest.senderAccount ? `****${selectedRequest.senderAccount}` : "—"}</span>
                </div>
                {selectedRequest.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-1">Notes:</span>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.paymentProofUrl && (
                  <div className="pt-2 border-t">
                    <a 
                      href={selectedRequest.paymentProofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Payment Proof
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            {selectedRequest?.status === "pending" && (
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
            <DialogTitle>Approve Upgrade Request</DialogTitle>
            <DialogDescription>
              This will activate the user's subscription with the requested plan.
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
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Upgrade Request</DialogTitle>
            <DialogDescription>
              The user will be notified that their request was declined.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for rejection</label>
              <Textarea
                placeholder="Explain why this request was rejected..."
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
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
