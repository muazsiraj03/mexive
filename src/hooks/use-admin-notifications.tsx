import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface AdminNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  is_read: boolean;
  is_global: boolean;
  action_url: string | null;
  created_at: string;
  created_by: string | null;
}

interface AdminPendingItem {
  id: string;
  type: "upgrade_request" | "credit_pack_purchase";
  user_id: string;
  user_name: string | null;
  title: string;
  description: string;
  created_at: string;
  action_url: string;
  status: string;
}

interface AdminNotificationsContextType {
  // Admin inbox - pending requests that need attention
  pendingItems: AdminPendingItem[];
  pendingCount: number;
  
  // Admin's own notifications (from the system or other admins)
  adminNotifications: AdminNotification[];
  unreadAdminCount: number;
  
  // Sent notifications by admins
  sentNotifications: AdminNotification[];
  
  loading: boolean;
  
  refreshPending: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const isVisible = usePageVisibility();
  const [pendingItems, setPendingItems] = useState<AdminPendingItem[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingItems = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      // Fetch pending upgrade requests
      const { data: upgradeRequests } = await supabase
        .from("upgrade_requests")
        .select("id, user_id, plan_name, requested_credits, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Fetch pending credit pack purchases
      const { data: creditPacks } = await supabase
        .from("credit_pack_purchases")
        .select("id, user_id, pack_name, credits, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Get user profiles for the names
      const userIds = [
        ...(upgradeRequests || []).map((r) => r.user_id),
        ...(creditPacks || []).map((p) => p.user_id),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      // Transform to pending items
      const items: AdminPendingItem[] = [
        ...(upgradeRequests || []).map((r) => ({
          id: r.id,
          type: "upgrade_request" as const,
          user_id: r.user_id,
          user_name: profileMap.get(r.user_id) || null,
          title: `Upgrade to ${r.plan_name}`,
          description: r.requested_credits
            ? `${r.requested_credits} credits requested`
            : "Plan upgrade request",
          created_at: r.created_at,
          action_url: "/admin/upgrade-requests",
          status: r.status,
        })),
        ...(creditPacks || []).map((p) => ({
          id: p.id,
          type: "credit_pack_purchase" as const,
          user_id: p.user_id,
          user_name: profileMap.get(p.user_id) || null,
          title: `Credit Pack: ${p.pack_name || "Unknown"}`,
          description: `${p.credits} credits`,
          created_at: p.created_at,
          action_url: "/admin/credit-pack-purchases",
          status: p.status,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingItems(items);
    } catch (error) {
      console.error("Error fetching pending items:", error);
    }
  }, [session]);

  const fetchAdminNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch notifications for the current admin user
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("created_at", { ascending: false })
        .limit(50);

      setAdminNotifications(
        (data || []).map((n) => ({
          ...n,
          type: n.type as AdminNotification["type"],
        }))
      );
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
    }
  }, [user]);

  const fetchSentNotifications = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const res = await fetch(
        `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSentNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
    }
  }, [session]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPendingItems(),
      fetchAdminNotifications(),
      fetchSentNotifications(),
    ]);
    setLoading(false);
  }, [fetchPendingItems, fetchAdminNotifications, fetchSentNotifications]);

  // Real-time subscription for pending items - only setup when page is visible
  useEffect(() => {
    if (!user || !isVisible) return;

    let upgradeChannel: RealtimeChannel;
    let creditChannel: RealtimeChannel;

    const setupRealtime = () => {
      upgradeChannel = supabase
        .channel("admin-upgrade-requests")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "upgrade_requests" },
          () => fetchPendingItems()
        )
        .subscribe();

      creditChannel = supabase
        .channel("admin-credit-purchases")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "credit_pack_purchases" },
          () => fetchPendingItems()
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (upgradeChannel) supabase.removeChannel(upgradeChannel);
      if (creditChannel) supabase.removeChannel(creditChannel);
    };
  }, [user, fetchPendingItems, isVisible]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = adminNotifications.find((n) => n.id === notificationId);
    if (!notification) return;

    if (notification.is_global) {
      await supabase
        .from("user_notification_reads")
        .insert({ user_id: user.id, notification_id: notificationId });
    } else {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    }

    setAdminNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const pendingCount = pendingItems.length;
  const unreadAdminCount = adminNotifications.filter((n) => !n.is_read).length;

  return (
    <AdminNotificationsContext.Provider
      value={{
        pendingItems,
        pendingCount,
        adminNotifications,
        unreadAdminCount,
        sentNotifications,
        loading,
        refreshPending: fetchPendingItems,
        refreshNotifications: fetchSentNotifications,
        markAsRead,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  }
  return context;
}
