import { format } from "date-fns";
import { History, CheckCircle, XCircle, Clock, AlertCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Subscription, PlanInfo } from "@/hooks/use-subscription";
import { downloadInvoice } from "@/lib/invoice-generator";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionHistoryProps {
  history: Subscription[];
  plans: PlanInfo[];
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    label: "Active",
    variant: "default" as const,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  pending: {
    icon: AlertCircle,
    label: "Pending",
    variant: "outline" as const,
    className: "border-warning text-warning",
  },
  canceled: {
    icon: XCircle,
    label: "Canceled",
    variant: "destructive" as const,
    className: "",
  },
  expired: {
    icon: Clock,
    label: "Expired",
    variant: "secondary" as const,
    className: "bg-muted text-muted-foreground",
  },
};

export function SubscriptionHistory({ history, plans }: SubscriptionHistoryProps) {
  const { user } = useAuth();

  if (history.length === 0) {
    return null;
  }

  const getPlanInfo = (planName: string): PlanInfo | undefined => {
    return plans.find((p) => p.name === planName);
  };

  const handleDownloadInvoice = async (subscription: Subscription) => {
    const planInfo = getPlanInfo(subscription.plan);
    await downloadInvoice({
      subscription,
      planDisplayName: planInfo?.displayName || subscription.plan,
      planPrice: planInfo?.price || 0,
      userEmail: user?.email || undefined,
      userName: user?.user_metadata?.full_name || undefined,
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Subscription History</CardTitle>
            <CardDescription>Your past subscription activity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {history.map((sub, index) => {
              const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.expired;
              const Icon = config.icon;
              const isFirst = index === 0;

              return (
                <div key={sub.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 top-1 h-4 w-4 rounded-full border-2 border-background ${
                      isFirst ? "bg-primary" : "bg-muted"
                    }`}
                  />

                  <div
                    className={`flex-1 rounded-lg border p-4 transition-colors ${
                      isFirst ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize text-foreground">
                          {sub.plan} Plan
                        </span>
                        <Badge variant={config.variant} className={config.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      {isFirst && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Started: {format(sub.startedAt, "MMM d, yyyy")}
                        </span>
                        {sub.expiresAt && (
                          <span>
                            {sub.status === "canceled" ? "Expires" : "Renews"}:{" "}
                            {format(sub.expiresAt, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {sub.plan !== "free" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(sub)}
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
