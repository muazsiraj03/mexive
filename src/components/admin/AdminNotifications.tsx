import { useState } from "react";
import { Send, Trash2, Globe, User, Bell, Inbox, ArrowUpRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/hooks/use-admin";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { AdminHeader } from "./AdminHeader";
import { useNavigate } from "react-router-dom";

const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  system: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const itemTypeColors: Record<string, string> = {
  upgrade_request: "bg-primary/10 text-primary border-primary/20",
  credit_pack_purchase: "bg-secondary/10 text-secondary border-secondary/20",
};

interface NotificationFormData {
  title: string;
  message: string;
  type: string;
  isGlobal: boolean;
  userId: string;
}

export function AdminNotifications() {
  const { users } = useAdmin();
  const {
    pendingItems,
    pendingCount,
    sentNotifications,
    loading: notificationsLoading,
    refreshPending,
    refreshNotifications,
  } = useAdminNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: "",
    message: "",
    type: "info",
    isGlobal: true,
    userId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.isGlobal && !formData.userId) {
      toast({
        title: "Error",
        description: "Please select a user or make it a global notification",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api/notifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            isGlobal: formData.isGlobal,
            userId: formData.isGlobal ? null : formData.userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "Success",
        description: formData.isGlobal 
          ? "Global notification sent to all users" 
          : "Notification sent to user",
      });

      setFormData({
        title: "",
        message: "",
        type: "info",
        isGlobal: true,
        userId: "",
      });

      refreshNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        refreshNotifications();
        toast({
          title: "Deleted",
          description: "Notification deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AdminHeader 
        title="Notifications" 
        description="Manage incoming requests and send notifications to users" 
      />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-4 w-4" />
                Inbox
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="send" className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Bell className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Inbox Tab - Pending user requests */}
            <TabsContent value="inbox" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Inbox className="h-5 w-5" />
                        Pending Requests
                      </CardTitle>
                      <CardDescription>
                        User requests that need your attention
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshPending}
                      disabled={notificationsLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${notificationsLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Inbox className="mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-lg font-medium text-muted-foreground">All caught up!</p>
                      <p className="text-sm text-muted-foreground">No pending requests at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingItems.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5">
                              <Badge variant="outline" className={itemTypeColors[item.type]}>
                                {item.type === "upgrade_request" ? "Upgrade" : "Credit Pack"}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.user_name || "Unknown user"} • {item.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(item.action_url)}
                            className="gap-2 shrink-0"
                          >
                            Review
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Send Tab - Create new notifications */}
            <TabsContent value="send" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Notification
                  </CardTitle>
                  <CardDescription>
                    Send notifications to all users or specific users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Notification title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Notification message"
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <Label htmlFor="isGlobal" className="cursor-pointer">
                            Global Notification
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Send to all users
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isGlobal"
                        checked={formData.isGlobal}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isGlobal: checked, userId: "" })
                        }
                      />
                    </div>

                    {!formData.isGlobal && (
                      <div className="space-y-2">
                        <Label htmlFor="userId">Select User</Label>
                        <Select
                          value={formData.userId}
                          onValueChange={(value) => setFormData({ ...formData, userId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {user.full_name || "Unnamed User"} ({user.plan})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? "Sending..." : "Send Notification"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab - Sent notifications */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification History
                      </CardTitle>
                      <CardDescription>
                        View and manage sent notifications
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshNotifications}
                      disabled={notificationsLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${notificationsLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No notifications sent yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentNotifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {notification.message}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={typeColors[notification.type]}>
                                  {notification.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {notification.is_global ? (
                                  <Badge variant="secondary">
                                    <Globe className="mr-1 h-3 w-3" />
                                    Global
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <User className="mr-1 h-3 w-3" />
                                    User
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(notification.created_at), "MMM d, HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDelete(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
