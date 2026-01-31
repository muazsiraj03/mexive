import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, CreditCard, Shield, Trash2, Sparkles, Loader2, Camera, Mail, KeyRound, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardHeader, DashboardBreadcrumb } from "./DashboardHeader";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useDashboard();
  const { user: authUser, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync name from user when it loads
  useEffect(() => {
    if (user.name) {
      setName(user.name);
    }
  }, [user.name]);

  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("user_id", authUser.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      await refreshProfile();
      toast.success("Profile updated successfully!");
    }
    
    setIsSaving(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${authUser.id}/avatar.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("generation-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("generation-images")
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", authUser.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validate new password
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        toast.success("Password updated successfully!");
        setShowPasswordDialog(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    // Note: Full account deletion would require a server-side function
    // For now, just sign out
    await signOut();
    toast.success("Logged out. Contact support to delete your account.");
    setIsDeleting(false);
  };

  const creditPercentage = user.totalCredits > 0 
    ? (user.credits / user.totalCredits) * 100 
    : 0;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Manage your account and subscription"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <DashboardBreadcrumb />

        {/* Profile Section */}
        <AnimatedSection variant="fade-up">
          <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <User className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Profile Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal details
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xl bg-secondary/20 text-secondary">
                      {getInitials(user.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Click to upload<br />Max 2MB
                </p>
              </div>

              {/* Form Fields */}
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-muted pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || name === user.name}
                className="rounded-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </AnimatedSection>

        {/* Subscription Section */}
        <AnimatedSection variant="fade-up" delay={100}>
          <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <CreditCard className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Subscription & Credits
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your plan and credit balance
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Current Plan */}
              <div className="rounded-xl border border-border/40 bg-muted/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Plan
                    </p>
                    <p className="mt-1 text-2xl font-bold capitalize text-foreground">
                      {user.plan}
                    </p>
                  </div>
                  <div className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                    Active
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    {user.plan === "free"
                      ? "3 images per batch"
                      : "10 images per batch"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    All 3 marketplaces
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    {user.plan === "free" ? "Basic support" : "Priority support"}
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="mt-4 w-full rounded-full"
                  onClick={() => navigate("/dashboard/subscription")}
                >
                  {user.plan === "free" ? "Upgrade Plan" : "Manage Subscription"}
                </Button>
              </div>

              {/* Credits */}
              <div className="rounded-xl border border-border/40 bg-muted/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {user.hasUnlimitedCredits ? "Credits" : "Monthly Credits"}
                    </p>
                    {user.hasUnlimitedCredits ? (
                      <div className="mt-1 flex items-center gap-2">
                        <Infinity className="h-8 w-8 text-secondary" />
                        <span className="text-2xl font-bold text-foreground">Unlimited</span>
                      </div>
                    ) : (
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {user.credits}{" "}
                        <span className="text-base font-normal text-muted-foreground">
                          / {user.totalCredits}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                {!user.hasUnlimitedCredits && (
                  <>
                    <Progress value={creditPercentage} className="mt-4 h-2" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {Math.round(creditPercentage)}% remaining
                    </p>
                  </>
                )}
                <Button 
                  variant="cta" 
                  className="mt-4 w-full rounded-full"
                  onClick={() => navigate("/dashboard/subscription")}
                >
                  {user.hasUnlimitedCredits ? "View Plans" : "Buy More Credits"}
                </Button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Security Section */}
        <AnimatedSection variant="fade-up" delay={200}>
          <div className="rounded-2xl border border-border/60 bg-card p-6 card-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Security
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your password and account security
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Change Password</p>
                    <p className="text-sm text-muted-foreground">
                      Update your password regularly for security
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-full"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Danger Zone */}
        <AnimatedSection variant="fade-up" delay={300}>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Irreversible account actions
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto rounded-full">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </AnimatedSection>
        </div>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
