import { ReactNode, useState, useEffect } from "react";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import Maintenance from "@/pages/Maintenance";

interface MaintenanceGuardProps {
  children: ReactNode;
  /** If true, bypass maintenance mode for admins */
  bypassForAdmin?: boolean;
}

export function MaintenanceGuard({ children, bypassForAdmin = false }: MaintenanceGuardProps) {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!bypassForAdmin || !session?.user?.id) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "admin" });
        
        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    }

    checkAdmin();
  }, [session?.user?.id, bypassForAdmin]);

  // Show nothing while loading to prevent flash
  if (settingsLoading || (bypassForAdmin && adminLoading)) {
    return null;
  }

  // If maintenance mode is enabled
  if (settings.maintenanceMode) {
    // Allow admins to bypass if specified
    if (bypassForAdmin && isAdmin) {
      return <>{children}</>;
    }
    
    // Show maintenance page for everyone else
    return <Maintenance />;
  }

  return <>{children}</>;
}
