import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin panel. This area is restricted to administrators only.
          </p>
          <Button asChild>
            <Navigate to="/dashboard" state={{ from: location }} replace />
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
