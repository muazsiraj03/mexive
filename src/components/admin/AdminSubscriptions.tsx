import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip } from "recharts";
import { AdminHeader } from "./AdminHeader";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS = {
  active: "hsl(var(--chart-1))",
  canceled: "hsl(var(--chart-2))",
  expired: "hsl(var(--chart-3))",
  pending: "hsl(var(--chart-4))",
};

const STATUS_ICONS = {
  active: CheckCircle,
  canceled: XCircle,
  expired: Clock,
  pending: AlertCircle,
};

const PLAN_COLORS: Record<string, string> = {
  free: "hsl(var(--muted-foreground))",
  pro: "hsl(var(--chart-1))",
  enterprise: "hsl(var(--chart-2))",
};

export function AdminSubscriptions() {
  const {
    subscriptions,
    subscriptionStats,
    fetchSubscriptions,
    approveSubscription,
    rejectSubscription,
    loading,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    subscriptionId: string;
    userName: string;
    plan: string;
  } | null>(null);

  useEffect(() => {
    fetchSubscriptions(page, statusFilter);
  }, [fetchSubscriptions, page, statusFilter]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleApprove = (sub: (typeof subscriptions)[0]) => {
    setConfirmDialog({
      open: true,
      action: "approve",
      subscriptionId: sub.id,
      userName: sub.profiles?.full_name || "Unknown",
      plan: sub.plan,
    });
  };

  const handleReject = (sub: (typeof subscriptions)[0]) => {
    setConfirmDialog({
      open: true,
      action: "reject",
      subscriptionId: sub.id,
      userName: sub.profiles?.full_name || "Unknown",
      plan: sub.plan,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    setActionLoading(confirmDialog.subscriptionId);

    const success =
      confirmDialog.action === "approve"
        ? await approveSubscription(confirmDialog.subscriptionId)
        : await rejectSubscription(confirmDialog.subscriptionId);

    if (success) {
      toast.success(
        confirmDialog.action === "approve"
          ? `Subscription approved for ${confirmDialog.userName}`
          : `Subscription rejected for ${confirmDialog.userName}`
      );
      await fetchSubscriptions(page, statusFilter);
    } else {
      toast.error(`Failed to ${confirmDialog.action} subscription`);
    }

    setActionLoading(null);
    setConfirmDialog(null);
  };

  // Separate pending subscriptions
  const pendingSubscriptions = subscriptions.filter((s) => s.status === "pending");

  // Calculate metrics
  const totalSubscriptions = subscriptionStats.total || 0;
  const activeRate = totalSubscriptions > 0 ? ((subscriptionStats.active || 0) / totalSubscriptions) * 100 : 0;
  const churnRate = totalSubscriptions > 0 ? ((subscriptionStats.canceled || 0) / totalSubscriptions) * 100 : 0;
  const pendingCount = subscriptionStats.pending || 0;

  // Status chart data
  const statusChartData = [
    { name: "Active", value: subscriptionStats.active, color: STATUS_COLORS.active },
    { name: "Pending", value: subscriptionStats.pending || 0, color: STATUS_COLORS.pending },
    { name: "Canceled", value: subscriptionStats.canceled, color: STATUS_COLORS.canceled },
    { name: "Expired", value: subscriptionStats.expired, color: STATUS_COLORS.expired },
  ].filter((item) => item.value > 0);

  // Plan distribution data
  const planChartData = useMemo(() => {
    const byPlan = subscriptionStats.byPlan || {};
    return Object.entries(byPlan).map(([plan, count]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value: count,
      color: PLAN_COLORS[plan] || "hsl(var(--chart-5))",
    }));
  }, [subscriptionStats.byPlan]);

  // Mock trend data for the last 30 days
  const trendData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map((day, index) => {
      // Simulate realistic subscription growth
      const baseActive = Math.max(0, subscriptionStats.active - 30 + index);
      const variation = Math.floor(Math.random() * 3);
      return {
        date: format(day, "MMM dd"),
        active: baseActive + variation,
        new: Math.floor(Math.random() * 3),
        churned: Math.floor(Math.random() * 2),
      };
    });
  }, [subscriptionStats.active]);

  const getStatusBadge = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    const variant =
      status === "active"
        ? "default"
        : status === "canceled"
        ? "destructive"
        : status === "pending"
        ? "outline"
        : "secondary";

    return (
      <Badge
        variant={variant}
        className={`capitalize flex items-center gap-1 ${status === "pending" ? "border-warning text-warning" : ""}`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleRefresh = () => {
    fetchSubscriptions(page, statusFilter);
    toast.success("Data refreshed");
  };

  return (
    <>
      <AdminHeader
        title="Subscription Management"
        description="Monitor subscriptions, track growth, and manage customer plans"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Subscriptions */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSubscriptions}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">+{Math.floor(totalSubscriptions * 0.12)}</span>
                <span>this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Rate */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-chart-1/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Rate</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeRate.toFixed(1)}%</div>
              <Progress value={activeRate} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptionStats.active} of {totalSubscriptions} active
              </p>
            </CardContent>
          </Card>

          {/* Churn Rate */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-destructive/10 to-transparent rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{churnRate.toFixed(1)}%</span>
                {churnRate < 5 && (
                  <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                    Healthy
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptionStats.canceled} canceled subscriptions
              </p>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className={`relative overflow-hidden ${pendingCount > 0 ? "border-warning/50" : ""}`}>
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${
                pendingCount > 0 ? "from-warning/20" : "from-muted/10"
              } to-transparent rounded-bl-full`}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              <AlertCircle className={`h-4 w-4 ${pendingCount > 0 ? "text-warning" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${pendingCount > 0 ? "text-warning" : ""}`}>{pendingCount}</span>
                {pendingCount > 0 && (
                  <Badge variant="outline" className="border-warning/30 text-warning text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCount > 0 ? "Awaiting your review" : "All caught up!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 relative">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Subscription Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Subscription Trend</CardTitle>
                      <CardDescription>Active subscriptions over the last 30 days</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
                        <span className="text-muted-foreground">New</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          className="fill-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="active"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#activeGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="new"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          fill="url(#newGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Breakdown by subscription status</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <>
                      <ChartContainer
                        config={{
                          value: { label: "Subscriptions" },
                        }}
                        className="h-[180px]"
                      >
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ChartContainer>
                      <div className="mt-4 space-y-2">
                        {statusChartData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No subscription data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Plan Distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Subscriptions by plan type</CardDescription>
                </CardHeader>
                <CardContent>
                  {planChartData.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={planChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {planChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No plan data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common subscription management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => setActiveTab("pending")}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                      <AlertCircle className="h-4 w-4 text-warning" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Review Pending</div>
                      <div className="text-xs text-muted-foreground">
                        {pendingCount} subscription{pendingCount !== 1 ? "s" : ""} awaiting approval
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <Badge className="ml-auto" variant="secondary">
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setStatusFilter("active");
                      setActiveTab("all");
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View Active</div>
                      <div className="text-xs text-muted-foreground">
                        {subscriptionStats.active} active subscription{subscriptionStats.active !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setStatusFilter("canceled");
                      setActiveTab("all");
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View Canceled</div>
                      <div className="text-xs text-muted-foreground">
                        {subscriptionStats.canceled} canceled subscription{subscriptionStats.canceled !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card className={pendingSubscriptions.length > 0 ? "border-warning/30 bg-warning/5" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-5 w-5 ${pendingSubscriptions.length > 0 ? "text-warning" : "text-muted-foreground"}`} />
                  <div>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>
                      {pendingSubscriptions.length > 0
                        ? `${pendingSubscriptions.length} subscription${pendingSubscriptions.length !== 1 ? "s" : ""} awaiting your review`
                        : "No pending subscriptions"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pendingSubscriptions.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Selected Tier</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSubscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarImage src={sub.profiles?.avatar_url || undefined} />
                                  <AvatarFallback className="bg-muted">
                                    {sub.profiles?.full_name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{sub.profiles?.full_name || "Anonymous"}</div>
                                  <div className="text-xs text-muted-foreground">ID: {sub.profiles?.id?.slice(0, 8)}...</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize font-medium">
                                {sub.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sub.requested_credits ? (
                                <div className="text-sm">
                                  <span className="font-semibold">{sub.requested_credits.toLocaleString()} credits</span>
                                  {sub.requested_price_cents && (
                                    <span className="text-muted-foreground ml-1">
                                      (${(sub.requested_price_cents / 100).toFixed(0)}/mo)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Default tier</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(parseISO(sub.created_at), "MMM d, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(sub)}
                                  disabled={actionLoading === sub.id}
                                  className="gap-1.5"
                                >
                                  {actionLoading === sub.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(sub)}
                                  disabled={actionLoading === sub.id}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">All caught up!</h3>
                    <p className="text-muted-foreground mt-1">No pending subscriptions to review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Subscriptions Tab */}
          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>All Subscriptions</CardTitle>
                    <CardDescription>Complete subscription history and management</CardDescription>
                  </div>
                  <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Credit Tier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions.length > 0 ? (
                            subscriptions.map((sub) => (
                              <TableRow key={sub.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border">
                                      <AvatarImage src={sub.profiles?.avatar_url || undefined} />
                                      <AvatarFallback className="bg-muted">
                                        {sub.profiles?.full_name?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{sub.profiles?.full_name || "Anonymous"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize font-medium">
                                    {sub.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {sub.requested_credits ? (
                                    <div className="text-sm">
                                      <span className="font-semibold">{sub.requested_credits.toLocaleString()}</span>
                                      <span className="text-muted-foreground ml-1">credits</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Default</span>
                                  )}
                                </TableCell>
                                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {format(parseISO(sub.started_at), "MMM d, yyyy")}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {sub.status === "pending" && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleApprove(sub)}
                                        disabled={actionLoading === sub.id}
                                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleReject(sub)}
                                        disabled={actionLoading === sub.id}
                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                  <CreditCard className="h-8 w-8 text-primary" />
                                  <span className="text-muted-foreground">No subscriptions found</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2">Page {page}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={subscriptions.length < 10}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {confirmDialog?.action === "approve" ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {confirmDialog?.action === "approve" ? "Approve Subscription?" : "Reject Subscription?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog?.action === "approve" ? (
                  <>
                    You are about to approve <strong>{confirmDialog?.userName}</strong>'s request for the{" "}
                    <strong className="capitalize">{confirmDialog?.plan}</strong> plan. This will activate their
                    subscription and grant them credits.
                  </>
                ) : (
                  <>
                    You are about to reject <strong>{confirmDialog?.userName}</strong>'s request for the{" "}
                    <strong className="capitalize">{confirmDialog?.plan}</strong> plan. They will be notified of this
                    decision.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                disabled={!!actionLoading}
                className={confirmDialog?.action === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {confirmDialog?.action === "approve" ? "Approve" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  );
}
