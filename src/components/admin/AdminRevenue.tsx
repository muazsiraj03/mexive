import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingUp, Download, Calendar, ArrowUpRight, ArrowDownRight, Trash2, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";
import { AdminHeader } from "./AdminHeader";
import { format, startOfWeek, startOfMonth, startOfYear, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type AggregationType = "daily" | "weekly" | "monthly" | "yearly";

interface AggregatedData {
  label: string;
  amount: number;
  transactions: number;
}

export function AdminRevenue() {
  const { revenueData, fetchRevenue, loading, resetRevenueData } = useAdmin();
  const [days, setDays] = useState("365");
  const [aggregation, setAggregation] = useState<AggregationType>("monthly");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchRevenue(parseInt(days));
  }, [fetchRevenue, days]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Aggregate chart data based on selected aggregation type
  const aggregatedChartData = useMemo(() => {
    if (!revenueData?.chartData) return [];

    const rawData = revenueData.chartData.map(item => ({
      date: item.date,
      amount: item.amount,
    }));

    if (rawData.length === 0) return [];

    const aggregated: Record<string, AggregatedData> = {};

    rawData.forEach(item => {
      const date = parseISO(item.date);
      let key: string;
      let label: string;

      switch (aggregation) {
        case "daily":
          key = item.date;
          label = format(date, "MMM d");
          break;
        case "weekly":
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          key = format(weekStart, "yyyy-MM-dd");
          label = `Week of ${format(weekStart, "MMM d")}`;
          break;
        case "monthly":
          const monthStart = startOfMonth(date);
          key = format(monthStart, "yyyy-MM");
          label = format(date, "MMM yyyy");
          break;
        case "yearly":
          const yearStart = startOfYear(date);
          key = format(yearStart, "yyyy");
          label = format(date, "yyyy");
          break;
        default:
          key = item.date;
          label = format(date, "MMM d");
      }

      if (!aggregated[key]) {
        aggregated[key] = { label, amount: 0, transactions: 0 };
      }
      aggregated[key].amount += item.amount;
      aggregated[key].transactions += 1;
    });

    return Object.values(aggregated).map(item => ({
      ...item,
      amount: item.amount / 100, // Convert cents to dollars
    }));
  }, [revenueData?.chartData, aggregation]);

  // Calculate period comparison
  const periodComparison = useMemo(() => {
    if (!revenueData?.chartData || revenueData.chartData.length === 0) {
      return { current: 0, previous: 0, change: 0 };
    }

    const totalDays = parseInt(days);
    const midPoint = Math.floor(totalDays / 2);
    const now = new Date();
    
    let currentTotal = 0;
    let previousTotal = 0;

    revenueData.chartData.forEach(item => {
      const date = parseISO(item.date);
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAgo <= midPoint) {
        currentTotal += item.amount;
      } else {
        previousTotal += item.amount;
      }
    });

    const change = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : currentTotal > 0 ? 100 : 0;

    return { current: currentTotal, previous: previousTotal, change };
  }, [revenueData?.chartData, days]);

  const exportToCSV = () => {
    if (!revenueData?.transactions) return;

    const headers = ["Date", "Amount", "Currency", "Type", "Status"];
    const rows = revenueData.transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      (t.amount / 100).toFixed(2),
      t.currency,
      t.type,
      t.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const revenueByTypeData = Object.entries(revenueData?.revenueByType || {}).map(
    ([type, amount]) => ({
      type: type.replace("_", " "),
      amount: amount / 100,
    })
  );

  const getAggregationLabel = () => {
    switch (aggregation) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "yearly": return "Yearly";
    }
  };

  return (
    <>
      <AdminHeader 
        title="Revenue Analytics" 
        description="Track your revenue and transactions" 
      />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Time Period:</span>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Reset All Revenue Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all transaction records and credit pack purchases. 
                      This action cannot be undone. Charts and statistics will be cleared.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={resetting}
                      onClick={async () => {
                        setResetting(true);
                        const success = await resetRevenueData();
                        setResetting(false);
                        if (success) {
                          toast.success("All revenue data has been reset");
                          fetchRevenue(parseInt(days));
                        } else {
                          toast.error("Failed to reset revenue data");
                        }
                      }}
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Yes, Reset All Data"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {loading || !revenueData ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrency(revenueData.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">Last {days} days</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
                </Card>

                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Period Growth</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${periodComparison.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {periodComparison.change >= 0 ? "+" : ""}{periodComparison.change.toFixed(1)}%
                      </span>
                      {periodComparison.change >= 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">vs previous period</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary/50 to-secondary" />
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.revenueByType.subscription || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Recurring revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Credit Packs</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.revenueByType.credit_pack || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">One-time purchases</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Growth Chart */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Revenue Growth</CardTitle>
                    <CardDescription>{getAggregationLabel()} revenue trend</CardDescription>
                  </div>
                  <Tabs value={aggregation} onValueChange={(v) => setAggregation(v as AggregationType)}>
                    <TabsList>
                      <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                      <TabsTrigger value="yearly" className="text-xs">Yearly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  {aggregatedChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        amount: { label: "Revenue", color: "hsl(var(--primary))" },
                      }}
                      className="h-[350px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={aggregatedChartData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                            angle={aggregation === "weekly" ? -45 : 0}
                            textAnchor={aggregation === "weekly" ? "end" : "middle"}
                            height={aggregation === "weekly" ? 60 : 30}
                          />
                          <YAxis
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Revenue"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No revenue data for this period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Type */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Type</CardTitle>
                    <CardDescription>Breakdown by payment type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueByTypeData.length > 0 ? (
                      <ChartContainer
                        config={{
                          amount: { label: "Revenue", color: "hsl(var(--primary))" },
                        }}
                        className="h-[250px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueByTypeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                            <YAxis dataKey="type" type="category" width={100} className="capitalize" />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                            />
                            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No revenue data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Period Summary</CardTitle>
                    <CardDescription>Comparison with previous period</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Period</span>
                        <span className="text-lg font-semibold">{formatCurrency(periodComparison.current)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min(100, periodComparison.previous > 0 
                              ? (periodComparison.current / Math.max(periodComparison.current, periodComparison.previous)) * 100 
                              : 100)}%` 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Previous Period</span>
                        <span className="text-lg font-semibold">{formatCurrency(periodComparison.previous)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-muted-foreground/50 rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min(100, periodComparison.current > 0 
                              ? (periodComparison.previous / Math.max(periodComparison.current, periodComparison.previous)) * 100 
                              : 100)}%` 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Net Change</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-bold ${periodComparison.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(periodComparison.current - periodComparison.previous)}
                          </span>
                          {periodComparison.change >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Last 50 transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueData.transactions.length > 0 ? (
                          revenueData.transactions.slice().reverse().map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="capitalize">{transaction.type.replace("_", " ")}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    transaction.status === "completed"
                                      ? "default"
                                      : transaction.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="capitalize"
                                >
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}
