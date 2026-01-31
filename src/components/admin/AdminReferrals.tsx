import { useState } from "react";
import { useAdminReferrals } from "@/hooks/use-referrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Gift, 
  Users, 
  TrendingUp,
  Settings,
  Percent,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { AdminHeader } from "./AdminHeader";

export function AdminReferrals() {
  const { 
    allReferrals, 
    settings, 
    adminStats, 
    isLoading,
    updateSettings,
    isUpdatingSettings 
  } = useAdminReferrals();

  const [localSettings, setLocalSettings] = useState({
    referrer_reward_credits: settings?.referrer_reward_credits ?? 10,
    referee_reward_credits: settings?.referee_reward_credits ?? 5,
    reward_trigger: settings?.reward_trigger ?? "signup",
    max_referrals_per_user: settings?.max_referrals_per_user ?? null,
    cap_period: settings?.cap_period ?? null,
    is_active: settings?.is_active ?? true,
  });

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setLocalSettings({
        referrer_reward_credits: settings.referrer_reward_credits,
        referee_reward_credits: settings.referee_reward_credits,
        reward_trigger: settings.reward_trigger,
        max_referrals_per_user: settings.max_referrals_per_user,
        cap_period: settings.cap_period,
        is_active: settings.is_active,
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettings(localSettings);
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader 
          title="Referral Management" 
          description="Configure and monitor the referral program" 
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader 
        title="Referral Management" 
        description="Configure and monitor the referral program" 
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              All time referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.completedReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Successful referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Completed / Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Distributed</CardTitle>
            <Gift className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalCreditsDistributed}</div>
            <p className="text-xs text-muted-foreground">
              Total credits given
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Referral Program Settings
          </CardTitle>
          <CardDescription>
            Configure rewards, triggers, and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Referral Program</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to earn credits through referrals
              </p>
            </div>
            <Switch
              checked={localSettings.is_active}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Referrer Reward */}
            <div className="space-y-2">
              <Label htmlFor="referrer-reward">Referrer Reward (credits)</Label>
              <Input
                id="referrer-reward"
                type="number"
                min="0"
                value={localSettings.referrer_reward_credits}
                onChange={(e) => 
                  setLocalSettings(prev => ({ 
                    ...prev, 
                    referrer_reward_credits: parseInt(e.target.value) || 0 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Credits given to the user who refers someone
              </p>
            </div>

            {/* Referee Reward */}
            <div className="space-y-2">
              <Label htmlFor="referee-reward">Referee Reward (credits)</Label>
              <Input
                id="referee-reward"
                type="number"
                min="0"
                value={localSettings.referee_reward_credits}
                onChange={(e) => 
                  setLocalSettings(prev => ({ 
                    ...prev, 
                    referee_reward_credits: parseInt(e.target.value) || 0 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Extra credits given to the new user who signs up
              </p>
            </div>

            {/* Reward Trigger */}
            <div className="space-y-2">
              <Label>Reward Trigger</Label>
              <Select
                value={localSettings.reward_trigger}
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, reward_trigger: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup">On Signup</SelectItem>
                  <SelectItem value="first_purchase">On First Purchase</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When should referral rewards be distributed
              </p>
            </div>

            {/* Referral Limit */}
            <div className="space-y-2">
              <Label>Referral Limit Per User</Label>
              <Select
                value={localSettings.max_referrals_per_user?.toString() ?? "unlimited"}
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ 
                    ...prev, 
                    max_referrals_per_user: value === "unlimited" ? null : parseInt(value),
                    cap_period: value === "unlimited" ? null : prev.cap_period || "monthly"
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="5">5 referrals</SelectItem>
                  <SelectItem value="10">10 referrals</SelectItem>
                  <SelectItem value="25">25 referrals</SelectItem>
                  <SelectItem value="50">50 referrals</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Maximum successful referrals per user
              </p>
            </div>
          </div>

          {localSettings.max_referrals_per_user && (
            <div className="space-y-2">
              <Label>Cap Period</Label>
              <Select
                value={localSettings.cap_period ?? "monthly"}
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, cap_period: value }))
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSaveSettings} 
            disabled={isUpdatingSettings}
            className="w-full sm:w-auto"
          >
            {isUpdatingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
          <CardDescription>
            View and manage all referral records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allReferrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Referrer ID</TableHead>
                  <TableHead>Referee ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rewards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      {format(new Date(referral.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {referral.referrer_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {referral.referee_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono">
                      {referral.referral_code}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={referral.status === "completed" ? "default" : "secondary"}
                      >
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {referral.status === "completed" && (
                        <span className="text-sm">
                          {referral.referrer_reward_credits + referral.referee_reward_credits} credits
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </>
  );
}
