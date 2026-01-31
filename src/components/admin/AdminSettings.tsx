import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useAuth } from "@/hooks/use-auth";
import { 
  Settings, 
  Shield, 
  Mail, 
  ToggleLeft, 
  Loader2, 
  UserPlus, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Zap,
  Users,
  Bell,
  Palette
} from "lucide-react";
import { AdminHeader } from "./AdminHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BrandingSettings } from "./BrandingSettings";
import { BankDetailsSettings } from "./BankDetailsSettings";
import { BkashDetailsSettings } from "./BkashDetailsSettings";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role_assigned_at: string;
  created_at: string | null;
}

export function AdminSettings() {
  const { toast } = useToast();
  const { session } = useAuth();
  const { settings: systemSettings, updateSetting, loading: settingsLoading } = useSystemSettings();
  const [togglingSettings, setTogglingSettings] = useState<Record<string, boolean>>({});
  
  // Admin management state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);

  const callAdminApi = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!session?.access_token) throw new Error("No session");
    
    const res = await fetch(
      `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api${path}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "API error");
    }
    return res.json();
  }, [session]);

  const fetchAdmins = useCallback(async () => {
    try {
      setAdminsLoading(true);
      const data = await callAdminApi("/admins");
      setAdmins(data.admins || []);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setAdminsLoading(false);
    }
  }, [callAdminApi]);

  useEffect(() => {
    if (session) {
      fetchAdmins();
    }
  }, [session, fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail || !newAdminPassword) {
      toast({
        title: "Missing fields",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    if (newAdminPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setCreatingAdmin(true);
    try {
      await callAdminApi("/admins", {
        method: "POST",
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          fullName: newAdminName || undefined,
        }),
      });
      
      toast({
        title: "Admin created",
        description: `${newAdminEmail} has been added as an admin`,
      });
      
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminName("");
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Failed to create admin",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    setRemovingAdmin(adminId);
    try {
      await callAdminApi(`/admins/${adminId}`, { method: "DELETE" });
      
      toast({
        title: "Admin removed",
        description: `${email} is no longer an admin`,
      });
      
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Failed to remove admin",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setRemovingAdmin(null);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean | string | number) => {
    setTogglingSettings(prev => ({ ...prev, [key]: true }));
    const success = await updateSetting(key, value);
    if (success) {
      toast({
        title: "Setting updated",
        description: `${key.replace(/_/g, ' ')} has been updated.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
    setTogglingSettings(prev => ({ ...prev, [key]: false }));
  };

  if (settingsLoading) {
    return (
      <>
        <AdminHeader 
          title="System Settings" 
          description="Configure platform settings and notifications" 
        />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader 
        title="System Settings" 
        description="Configure platform settings and manage administrators" 
      />
      
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4 hidden sm:block" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4 hidden sm:block" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <Zap className="h-4 w-4 hidden sm:block" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="admins" className="gap-2">
                <Shield className="h-4 w-4 hidden sm:block" />
                Admins
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4 hidden sm:block" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
              {/* Credit Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Credit Settings
                  </CardTitle>
                  <CardDescription>
                    Configure initial and daily credits for new users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstSignupCredits">First Signup Credits</Label>
                      <Input
                        id="firstSignupCredits"
                        type="number"
                        min="0"
                        value={systemSettings.firstSignupCredits}
                        onChange={(e) => handleToggleSetting('first_signup_credits', e.target.value)}
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground">
                        One-time credits given when a new user signs up
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dailyRenewableCredits">Daily Renewable Credits</Label>
                      <Input
                        id="dailyRenewableCredits"
                        type="number"
                        min="0"
                        value={systemSettings.dailyRenewableCredits}
                        onChange={(e) => handleToggleSetting('daily_renewable_credits', e.target.value)}
                        placeholder="2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Credits restored daily after initial signup credits are used
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Platform Features
                  </CardTitle>
                  <CardDescription>
                    Enable or disable core platform functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle
                    id="enableNewSignups"
                    icon={<Users className="h-4 w-4" />}
                    label="Allow New Signups"
                    description="Allow new users to create accounts on the platform"
                    checked={systemSettings.enableNewSignups}
                    disabled={togglingSettings.enable_new_signups}
                    onCheckedChange={(checked) => handleToggleSetting('enable_new_signups', checked)}
                  />

                  <Separator />

                  <SettingToggle
                    id="enableCreditPacks"
                    icon={<Zap className="h-4 w-4" />}
                    label="Enable Credit Packs"
                    description="Allow users to purchase one-time credit packs"
                    checked={systemSettings.enableCreditPacks}
                    disabled={togglingSettings.enable_credit_packs}
                    onCheckedChange={(checked) => handleToggleSetting('enable_credit_packs', checked)}
                  />
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Critical settings that affect all users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <ToggleLeft className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <Label htmlFor="maintenanceMode" className="font-medium">
                          Maintenance Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Show maintenance page to all users. Admins can still access the dashboard.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      disabled={togglingSettings.maintenance_mode}
                      onCheckedChange={(checked) => handleToggleSetting('maintenance_mode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <BrandingSettings />
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <BankDetailsSettings />
              <BkashDetailsSettings />
            </TabsContent>

            {/* Admins Tab */}
            <TabsContent value="admins" className="space-y-6">
              {/* Add New Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add Administrator
                  </CardTitle>
                  <CardDescription>
                    Create a new admin account with full dashboard access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Full Name</Label>
                        <Input
                          id="adminName"
                          type="text"
                          placeholder="John Doe"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email Address *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@example.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Password *</Label>
                        <div className="relative">
                          <Input
                            id="adminPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            required
                            minLength={6}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" disabled={creatingAdmin} className="w-full sm:w-auto">
                          {creatingAdmin ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create Admin
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Current Admins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Current Administrators
                  </CardTitle>
                  <CardDescription>
                    {admins.length} administrator{admins.length !== 1 ? 's' : ''} with dashboard access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adminsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : admins.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                      <p className="text-muted-foreground">No administrators found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={admin.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{admin.full_name || "No name"}</p>
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            disabled={removingAdmin === admin.id}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            {removingAdmin === admin.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure automated email notifications for users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="font-medium">Welcome Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Send a welcome email to new users after signup
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="font-medium">Low Credit Alert</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify users when their credits fall below threshold
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="font-medium">Subscription Renewal</Label>
                        <p className="text-sm text-muted-foreground">
                          Remind users before their subscription renews
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    In-App Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure notification behavior within the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="font-medium">Show Toast Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Display pop-up notifications for important events
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="font-medium">Credit Usage Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify users when they use credits for generations
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

// Reusable Setting Toggle Component
interface SettingToggleProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingToggle({ id, icon, label, description, checked, disabled, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-muted/30">
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground mt-0.5">{icon}</span>
        <div>
          <Label htmlFor={id} className="font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
