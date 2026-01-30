import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Global presence tracker component that tracks user activity across the app.
 * Include this in any layout where you want users to be tracked.
 */
export function PresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create presence channel
    const channel = supabase.channel("live-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || "Anonymous",
          avatar_url: user.user_metadata?.avatar_url || null,
          online_at: new Date().toISOString(),
          current_page: window.location.pathname,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user]);

  // Update presence when location changes
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !user) return;

    const updatePresence = async () => {
      try {
        await channel.track({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || "Anonymous",
          avatar_url: user.user_metadata?.avatar_url || null,
          online_at: new Date().toISOString(),
          current_page: location.pathname,
        });
      } catch (error) {
        // Silently ignore tracking errors
      }
    };

    updatePresence();
  }, [location.pathname, user]);

  // This component doesn't render anything
  return null;
}
