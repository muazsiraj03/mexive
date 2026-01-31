import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface UpgradeRequest {
  id: string;
  userId: string;
  planName: string;
  requestedCredits: number | null;
  requestedPriceCents: number | null;
  transactionId: string | null;
  paymentDate: string | null;
  senderName: string | null;
  senderAccount: string | null;
  paymentProofUrl: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  // Joined data
  userEmail?: string;
  userName?: string;
}

export function useUpgradeRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching upgrade requests:", error);
        return;
      }

      setRequests(
        data.map((r) => ({
          id: r.id,
          userId: r.user_id,
          planName: r.plan_name,
          requestedCredits: r.requested_credits,
          requestedPriceCents: r.requested_price_cents,
          transactionId: r.transaction_id,
          paymentDate: r.payment_date,
          senderName: r.sender_name,
          senderAccount: r.sender_account,
          paymentProofUrl: r.payment_proof_url,
          notes: r.notes,
          status: r.status as UpgradeRequest["status"],
          adminNotes: r.admin_notes,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          createdAt: r.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching upgrade requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();

    if (user) {
      const channel = supabase
        .channel("upgrade_requests_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "upgrade_requests" },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchRequests, user]);

  const createRequest = async (data: {
    planName: string;
    requestedCredits?: number;
    requestedPriceCents?: number;
    transactionId?: string;
    paymentDate?: string;
    senderName?: string;
    senderAccount?: string;
    paymentProofUrl?: string;
    notes?: string;
  }) => {
    if (!user) {
      toast.error("Please log in to submit a request");
      return { success: false };
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from("upgrade_requests").insert({
        user_id: user.id,
        plan_name: data.planName,
        requested_credits: data.requestedCredits,
        requested_price_cents: data.requestedPriceCents,
        transaction_id: data.transactionId,
        payment_date: data.paymentDate,
        sender_name: data.senderName,
        sender_account: data.senderAccount,
        payment_proof_url: data.paymentProofUrl,
        notes: data.notes,
      });

      if (error) {
        console.error("Error creating upgrade request:", error);
        toast.error("Failed to submit upgrade request");
        return { success: false };
      }

      toast.success("Upgrade request submitted! We'll review it shortly.");
      await fetchRequests();
      return { success: true };
    } catch (error) {
      console.error("Error creating upgrade request:", error);
      toast.error("Failed to submit upgrade request");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const approveRequest = async (requestId: string, adminNotes?: string) => {
    if (!user) return { success: false };

    setActionLoading(true);
    try {
      // Get the request first
      const { data: request, error: fetchError } = await supabase
        .from("upgrade_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError || !request) {
        toast.error("Request not found");
        return { success: false };
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from("upgrade_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        toast.error("Failed to approve request");
        return { success: false };
      }

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: request.user_id,
        title: "Upgrade Request Approved! 🎉",
        message: `Your upgrade to the ${request.plan_name} plan has been approved. Your subscription is now active!`,
        type: "success",
      });

      toast.success("Request approved successfully");
      await fetchRequests();
      return { success: true };
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRequest = async (requestId: string, adminNotes?: string) => {
    if (!user) return { success: false };

    setActionLoading(true);
    try {
      const { data: request, error: fetchError } = await supabase
        .from("upgrade_requests")
        .select("user_id, plan_name")
        .eq("id", requestId)
        .single();

      if (fetchError || !request) {
        toast.error("Request not found");
        return { success: false };
      }

      const { error: updateError } = await supabase
        .from("upgrade_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        toast.error("Failed to reject request");
        return { success: false };
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: request.user_id,
        title: "Upgrade Request Declined",
        message: adminNotes || `Your upgrade request for the ${request.plan_name} plan was not approved. Please contact support for more information.`,
        type: "error",
      });

      toast.success("Request rejected");
      await fetchRequests();
      return { success: true };
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  return {
    requests,
    loading,
    actionLoading,
    createRequest,
    approveRequest,
    rejectRequest,
    refresh: fetchRequests,
  };
}
