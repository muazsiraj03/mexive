import { format } from "date-fns";
import { Coins, ImageIcon, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";

export function CreditUsageHistory() {
  const { generations } = useDashboard();

  if (generations.length === 0) {
    return null;
  }

  // Calculate credits used per generation (1 credit per marketplace)
  const usageHistory = generations.map((gen) => ({
    id: gen.id,
    date: gen.createdAt,
    fileName: gen.fileName,
    creditsUsed: gen.marketplaces.length,
    marketplaces: gen.marketplaces.map((m) => m.name),
  }));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Credit Usage History</CardTitle>
            <CardDescription>Your recent credit usage activity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {usageHistory.slice(0, 10).map((usage, index) => {
              const isFirst = index === 0;

              return (
                <div key={usage.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 top-1 h-4 w-4 rounded-full border-2 border-background ${
                      isFirst ? "bg-secondary" : "bg-muted"
                    }`}
                  />

                  <div
                    className={`flex-1 rounded-lg border p-4 transition-colors ${
                      isFirst ? "border-secondary/20 bg-secondary/5" : "border-border/60 bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {usage.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-secondary">
                          -{usage.creditsUsed} credit{usage.creditsUsed !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{format(usage.date, "MMM d, yyyy 'at' h:mm a")}</span>
                      <span>•</span>
                      <span>{usage.marketplaces.join(", ")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {usageHistory.length > 10 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Showing last 10 of {usageHistory.length} generations
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
