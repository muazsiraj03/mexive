import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useAdminSearch } from "@/hooks/use-admin-search";
import { useLiveUsers, LiveUser } from "@/hooks/use-live-users";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, ChevronLeft, ChevronRight, Edit, Infinity, Circle, Users, Activity, Clock, MapPin, RefreshCw, Trash2, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "./AdminHeader";
import { formatDistanceToNow } from "date-fns";

function LiveUserCard({ user }: { user: LiveUser }) {
  const getPageName = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return "Home";
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" > ");
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <Circle className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-green-500 text-green-500 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{user.full_name || "Anonymous"}</p>
          <Badge variant="outline" className="text-green-600 border-green-600/50 bg-green-500/10 shrink-0">
            Online
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {getPageName(user.current_page)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(user.online_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveUsersTab() {
  const { liveUsers, isConnected, onlineCount, lastRefresh, refresh } = useLiveUsers();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{onlineCount}</div>
              <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">Active users right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className={isConnected ? "bg-green-500" : ""}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Realtime presence channel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-refreshing in real-time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Users List */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Active Users</span>
              <Badge variant="secondary">{onlineCount}</Badge>
            </CardTitle>
            <CardDescription>
              Users currently browsing your application
            </CardDescription>
          </div>
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
        </CardHeader>
        <CardContent>
          {liveUsers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {liveUsers.map((user) => (
                <LiveUserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No users online</p>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? "Waiting for users to connect..."
                  : "Connecting to presence channel..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsers() {
  const { users, usersPagination, fetchUsers, updateUser, loading } = useAdmin();
  const { session } = useAuth();
  const { globalSearch } = useAdminSearch();
  const { onlineCount } = useLiveUsers();
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [editForm, setEditForm] = useState({ plan: "", credits: 0, has_unlimited_credits: false });
  const [saving, setSaving] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  const callAdminApi = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!session?.access_token) throw new Error("No session");
    const baseUrl = `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api${path}`;
    const res = await fetch(baseUrl, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "API error");
    }
    return res.json();
  }, [session]);

  // Fetch user roles when users change
  const fetchUserRoles = useCallback(async () => {
    const rolesMap: Record<string, string> = {};
    await Promise.all(
      users.map(async (user) => {
        try {
          const data = await callAdminApi(`/users/${user.id}/roles`);
          if (data.roles && data.roles.length > 0) {
            rolesMap[user.id] = data.roles[0].role;
          } else {
            rolesMap[user.id] = "user";
          }
        } catch {
          rolesMap[user.id] = "user";
        }
      })
    );
    setUserRoles(rolesMap);
  }, [users, callAdminApi]);

  useEffect(() => {
    if (users.length > 0) {
      fetchUserRoles();
    }
  }, [users, fetchUserRoles]);

  // Combined search from header and local input
  const effectiveSearch = globalSearch || localSearch;

  useEffect(() => {
    fetchUsers(1, effectiveSearch, planFilter);
    setLastRefresh(new Date());
  }, [fetchUsers, effectiveSearch, planFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers(usersPagination.page, effectiveSearch, planFilter);
    setLastRefresh(new Date());
    setIsRefreshing(false);
    toast({ title: "Users refreshed" });
  };

  const handleSearch = (value: string) => {
    setLocalSearch(value);
  };

  const handlePlanFilter = (value: string) => {
    setPlanFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, effectiveSearch, planFilter);
  };

  const handleEditClick = (user: typeof users[0]) => {
    setEditingUser(user);
    setEditForm({ plan: user.plan, credits: user.credits, has_unlimited_credits: user.has_unlimited_credits || false });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    const success = await updateUser(editingUser.id, {
      plan: editForm.plan,
      credits: editForm.credits,
      has_unlimited_credits: editForm.has_unlimited_credits,
    });
    setSaving(false);

    if (success) {
      toast({ title: "User updated successfully" });
      setEditingUser(null);
      fetchUsers(usersPagination.page, effectiveSearch, planFilter);
    } else {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    setUpdatingRoleUserId(targetUserId);
    try {
      await callAdminApi(`/users/${targetUserId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      });
      setUserRoles((prev) => ({ ...prev, [targetUserId]: newRole }));
      toast({ title: `Role updated to ${newRole}` });
    } catch (error) {
      toast({ title: "Failed to update role", variant: "destructive" });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    setDeletingUserId(targetUserId);
    try {
      await callAdminApi(`/users/${targetUserId}`, { method: "DELETE" });
      toast({ title: "User deleted successfully" });
      fetchUsers(usersPagination.page, effectiveSearch, planFilter);
    } catch (error) {
      toast({ 
        title: "Failed to delete user", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldAlert className="h-3 w-3" />;
      case "moderator": return <ShieldCheck className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "moderator": return "secondary";
      default: return "outline";
    }
  };

  return (
    <>
      <AdminHeader 
        title="User Management" 
        description="View and manage all users on your platform" 
      />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
        <Tabs defaultValue="all-users" className="w-full">
          <TabsList>
            <TabsTrigger value="all-users" className="gap-2">
              <Users className="h-4 w-4" />
              All Users
              <Badge variant="secondary" className="ml-1">{usersPagination.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="live-users" className="gap-2">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              Live Users
              {onlineCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-600">{onlineCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-users" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Total: {usersPagination.total} users • Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={globalSearch ? `Global: "${globalSearch}"` : "Search by name..."}
                      value={localSearch}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                      disabled={!!globalSearch}
                    />
                  </div>
                  <Select value={planFilter || "all"} onValueChange={handlePlanFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length > 0 ? (
                            users.map((user) => {
                              const currentRole = userRoles[user.id] || "user";
                              const isUpdatingRole = updatingRoleUserId === user.id;
                              const isDeleting = deletingUserId === user.id;

                              return (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url || undefined} />
                                        <AvatarFallback>
                                          {user.full_name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{user.full_name || "Anonymous"}</p>
                                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={currentRole}
                                      onValueChange={(value) => handleRoleChange(user.id, value)}
                                      disabled={isUpdatingRole}
                                    >
                                      <SelectTrigger className="w-[130px] h-8">
                                        {isUpdatingRole ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            {getRoleIcon(currentRole)}
                                            <span className="capitalize">{currentRole}</span>
                                          </div>
                                        )}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">
                                          <div className="flex items-center gap-2">
                                            <Shield className="h-3 w-3" />
                                            User
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="moderator">
                                          <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-3 w-3" />
                                            Moderator
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="admin">
                                          <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-3 w-3" />
                                            Admin
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {user.plan}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {user.has_unlimited_credits ? (
                                      <Badge variant="secondary" className="gap-1">
                                        <Infinity className="h-3 w-3" />
                                        Unlimited
                                      </Badge>
                                    ) : (
                                      `${user.credits} / ${user.total_credits}`
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(user)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit User</DialogTitle>
                                            <DialogDescription>
                                              Update user plan and credits
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                              <Label htmlFor="plan">Plan</Label>
                                              <Select
                                                value={editForm.plan}
                                                onValueChange={(value) =>
                                                  setEditForm({ ...editForm, plan: value })
                                                }
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="free">Free</SelectItem>
                                                  <SelectItem value="pro">Pro</SelectItem>
                                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="grid gap-2">
                                              <Label htmlFor="credits">Credits</Label>
                                              <Input
                                                id="credits"
                                                type="number"
                                                value={editForm.credits}
                                                onChange={(e) =>
                                                  setEditForm({
                                                    ...editForm,
                                                    credits: parseInt(e.target.value) || 0,
                                                  })
                                                }
                                                disabled={editForm.has_unlimited_credits}
                                              />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border border-border p-4">
                                              <div className="space-y-0.5">
                                                <Label htmlFor="unlimited-credits" className="flex items-center gap-2">
                                                  <Infinity className="h-4 w-4" />
                                                  Unlimited Credits
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                  User can generate without credit limits
                                                </p>
                                              </div>
                                              <Switch
                                                id="unlimited-credits"
                                                checked={editForm.has_unlimited_credits}
                                                onCheckedChange={(checked) =>
                                                  setEditForm({ ...editForm, has_unlimited_credits: checked })
                                                }
                                              />
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button onClick={handleSaveUser} disabled={saving}>
                                              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                              Save Changes
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            disabled={isDeleting}
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete <strong>{user.full_name || "this user"}</strong>? 
                                              This action cannot be undone and will permanently remove all user data including:
                                              <ul className="list-disc list-inside mt-2 space-y-1">
                                                <li>Account and profile information</li>
                                                <li>All generations and history</li>
                                                <li>Subscriptions and transactions</li>
                                              </ul>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteUser(user.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete User
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {usersPagination.page} of {usersPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(usersPagination.page - 1)}
                          disabled={usersPagination.page <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(usersPagination.page + 1)}
                          disabled={usersPagination.page >= usersPagination.totalPages}
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

          <TabsContent value="live-users" className="mt-6">
            <LiveUsersTab />
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </>
  );
}
