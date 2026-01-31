import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { useLiveUsers } from "@/hooks/use-live-users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, TrendingUp, Loader2, Activity, Images, MessageSquareText, FileSearch, UserPlus, RefreshCw, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { AdminHeader } from "./AdminHeader";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

interface ToolStats {
  totalGenerations: number;
  totalPrompts: number;
  totalReviews: number;
  reviewPassRate: number;
}

interface GrowthData {
  date: string;
  users: number;
}

export function AdminOverview() {
  const { stats, fetchStats, loading } = useAdmin();
  const { session } = useAuth();
  const { onlineCount } = useLiveUsers();
  const [toolStats, setToolStats] = useState<ToolStats | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const callAdminApi = useCallback(async (path: string) => {
    if (!session?.access_token) return null;
    const baseUrl = `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api${path}`;
    const res = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    return res.json();
  }, [session]);

  const fetchToolStats = useCallback(async () => {
    try {
      const data = await callAdminApi("/tool-stats");
      if (data) setToolStats(data);
    } catch (error) {
      console.error("Failed to fetch tool stats:", error);
    }
  }, [callAdminApi]);

  const fetchGrowthData = useCallback(async () => {
    try {
      const data = await callAdminApi("/user-growth");
      if (data?.growth) setGrowthData(data.growth);
    } catch (error) {
      console.error("Failed to fetch growth data:", error);
    }
  }, [callAdminApi]);

  useEffect(() => {
    fetchStats();
    fetchToolStats();
    fetchGrowthData();
    setLastRefresh(new Date());
  }, [fetchStats, fetchToolStats, fetchGrowthData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchToolStats(), fetchGrowthData()]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  if (loading || !stats) {
    return (
      <>
        <AdminHeader 
          title="Dashboard Overview" 
          description="Monitor your SaaS metrics and performance" 
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  const planData = Object.entries(stats.subscriptionsByPlan).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const conversionRate = stats.totalUsers > 0 
    ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) 
    : "0";

  return (
    <>
      <AdminHeader 
        title="Dashboard Overview" 
        description="Monitor your SaaS metrics and performance" 
      />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Refresh Bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Primary Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <UserPlus className="h-3 w-3" />
                    +{stats.newUsersLast30Days}
                  </Badge>
                  <span className="text-xs text-muted-foreground">last 30 days</span>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeSubscriptions}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {conversionRate}% conversion rate
                  </span>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary/50 to-secondary" />
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(stats.mrr)}</div>
                <p className="text-xs text-muted-foreground mt-1">MRR from subscriptions</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/50 to-accent" />
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-muted to-muted-foreground/50" />
            </Card>
          </div>

          {/* Secondary Stats Row - Live Users & Tool Usage */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Users</CardTitle>
                <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineCount}</div>
                <p className="text-xs text-muted-foreground">Currently browsing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metadata Generated</CardTitle>
                <Images className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {toolStats?.totalGenerations?.toLocaleString() || "—"}
                </div>
                <p className="text-xs text-muted-foreground">Total generations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prompts Extracted</CardTitle>
                <MessageSquareText className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {toolStats?.totalPrompts?.toLocaleString() || "—"}
                </div>
                <p className="text-xs text-muted-foreground">Image to prompt uses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Files Reviewed</CardTitle>
                <FileSearch className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {toolStats?.totalReviews?.toLocaleString() || "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {toolStats?.reviewPassRate ? `${toolStats.reviewPassRate.toFixed(0)}% pass rate` : "Quality reviews"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  User Growth
                </CardTitle>
                <CardDescription>New user signups over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {growthData.length > 0 ? (
                  <ChartContainer
                    config={{
                      users: { label: "New Users", color: "hsl(var(--primary))" },
                    }}
                    className="h-[220px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorUsers)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No growth data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscriptions by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Plan</CardTitle>
                <CardDescription>Distribution of active subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {planData.length > 0 ? (
                  <div className="flex items-center gap-8">
                    <ChartContainer
                      config={{
                        value: { label: "Subscriptions" },
                      }}
                      className="h-[180px] w-[180px]"
                    >
                      <PieChart>
                        <Pie
                          data={planData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {planData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex-1 space-y-3">
                      {planData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{item.value}</span>
                            <span className="text-xs text-muted-foreground">
                              ({((item.value / stats.activeSubscriptions) * 100 || 0).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No subscription data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest signups on your platform</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentUsers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {stats.recentUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12 mb-3">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-center truncate w-full">
                        {user.full_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {user.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No users yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
