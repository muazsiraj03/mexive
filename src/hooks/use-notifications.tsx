import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  is_read: boolean;
  is_global: boolean;
  created_at: string;
  created_by: string | null;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isVisible = usePageVisibility();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readGlobalIds, setReadGlobalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch notifications (user's own + global)
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError);
        return;
      }

      // Fetch read status for global notifications
      const { data: readData } = await supabase
        .from("user_notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      const readIds = new Set(readData?.map(r => r.notification_id) || []);
      setReadGlobalIds(readIds);

      // Map notifications with proper read status
      const mappedNotifications: Notification[] = (notificationsData || []).map(n => ({
        ...n,
        type: n.type as Notification["type"],
        is_read: n.is_global ? readIds.has(n.id) : n.is_read,
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Real-time subscription - only setup when page is visible
  useEffect(() => {
    if (!user || !isVisible) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      channel = supabase
        .channel("notifications-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            // Check if this notification is for the current user or is global
            if (newNotification.user_id === user.id || newNotification.is_global) {
              setNotifications(prev => [
                { ...newNotification, is_read: false },
                ...prev,
              ]);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const deletedId = (payload.old as { id: string }).id;
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, isVisible]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    if (notification.is_global) {
      // For global notifications, insert into user_notification_reads
      await supabase
        .from("user_notification_reads")
        .insert({ user_id: user.id, notification_id: notificationId });
      
      setReadGlobalIds(prev => new Set([...prev, notificationId]));
    } else {
      // For user-specific notifications, update is_read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    }

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(n => !n.is_read);
    const globalUnread = unreadNotifications.filter(n => n.is_global);
    const userUnread = unreadNotifications.filter(n => !n.is_global);

    // Mark global notifications as read
    if (globalUnread.length > 0) {
      const inserts = globalUnread.map(n => ({
        user_id: user.id,
        notification_id: n.id,
      }));
      await supabase.from("user_notification_reads").insert(inserts);
      setReadGlobalIds(prev => new Set([...prev, ...globalUnread.map(n => n.id)]));
    }

    // Mark user notifications as read
    if (userUnread.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Users can only delete their own non-global notifications
    if (!notification.is_global && notification.user_id === user.id) {
      await supabase.from("notifications").delete().eq("id", notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
