import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToolAccess, ToolId, getToolDisplayName } from "@/hooks/use-tool-access";
import { Skeleton } from "@/components/ui/skeleton";

interface ToolAccessGateProps {
  toolId: ToolId;
  children: React.ReactNode;
}

export function ToolAccessGate({ toolId, children }: ToolAccessGateProps) {
  const { hasAccess, isLoading, userPlan } = useToolAccess(toolId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">
              {getToolDisplayName(toolId)} is Locked
            </CardTitle>
            <CardDescription className="text-base">
              This tool is not available on the{" "}
              <span className="font-medium capitalize">{userPlan}</span> plan.
              Upgrade your subscription to unlock access.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild className="w-full gap-2">
              <Link to="/dashboard/subscription">
                <Sparkles className="h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
