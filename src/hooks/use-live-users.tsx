import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface LiveUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
  current_page: string;
}

interface PresencePayload {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
  current_page: string;
  presence_ref?: string;
}

export function useLiveUsers() {
  const { user } = useAuth();
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const processPresenceState = useCallback((channel: RealtimeChannel) => {
    const state = channel.presenceState();
    const users: LiveUser[] = [];
    
    Object.entries(state).forEach(([key, presences]) => {
      // Skip admin listener entries
      if (key.startsWith("admin-listener-")) return;
      
      if (Array.isArray(presences) && presences.length > 0) {
        const latestPresence = presences[presences.length - 1] as PresencePayload;
        if (latestPresence.id) {
          users.push({
            id: latestPresence.id,
            full_name: latestPresence.full_name,
            avatar_url: latestPresence.avatar_url,
            online_at: latestPresence.online_at,
            current_page: latestPresence.current_page,
          });
        }
      }
    });

    // Sort by online_at (most recent first) and dedupe by user id
    const uniqueUsers = users.reduce((acc, user) => {
      const existing = acc.find(u => u.id === user.id);
      if (!existing || new Date(user.online_at) > new Date(existing.online_at)) {
        return [...acc.filter(u => u.id !== user.id), user];
      }
      return acc;
    }, [] as LiveUser[]);

    uniqueUsers.sort((a, b) => 
      new Date(b.online_at).getTime() - new Date(a.online_at).getTime()
    );

    setLiveUsers(uniqueUsers);
    setLastRefresh(new Date());
  }, []);

  const refresh = useCallback(async () => {
    if (channelRef.current && user) {
      // Re-track to trigger a sync
      await channelRef.current.track({
        id: `admin-listener-${user.id}`,
        full_name: null,
        avatar_url: null,
        online_at: new Date().toISOString(),
        current_page: "__admin_listener__",
      });
      processPresenceState(channelRef.current);
    }
  }, [user, processPresenceState]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to the live-users channel with presence config to receive sync events
    const channel = supabase.channel("live-users", {
      config: {
        presence: {
          key: `admin-listener-${user.id}`,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        processPresenceState(channel);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          // Must call track() to join presence and receive sync events
          await channel.track({
            id: `admin-listener-${user.id}`,
            full_name: null,
            avatar_url: null,
            online_at: new Date().toISOString(),
            current_page: "__admin_listener__",
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [user, processPresenceState]);

  return {
    liveUsers,
    isConnected,
    onlineCount: liveUsers.length,
    lastRefresh,
    refresh,
  };
}
