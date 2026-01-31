import { useState } from "react";
import { useReferrals } from "@/hooks/use-referrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Copy, 
  Share2, 
  Gift, 
  Users, 
  TrendingUp,
  Check,
  Edit2,
  X,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ReferralPage() {
  const { 
    referralCode, 
    referrals, 
    settings, 
    stats, 
    isLoading,
    updateCode,
    isUpdatingCode 
  } = useReferrals();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState("");

  const referralLink = referralCode?.code 
    ? `https://mexive.lovable.app/auth?ref=${referralCode.code}`
    : "";

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${type === "code" ? "Referral code" : "Referral link"} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Mexive",
          text: `Use my referral code ${referralCode?.code} to get bonus credits on Mexive!`,
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      copyToClipboard(referralLink, "link");
    }
  };

  const handleSaveCode = () => {
    if (newCode.length < 4) {
      toast.error("Code must be at least 4 characters");
      return;
    }
    updateCode(newCode);
    setIsEditing(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Join me on Mexive! Use my referral code ${referralCode?.code} to get bonus credits. 🎁`);
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Join me on Mexive! Use my referral code ${referralCode?.code} to get bonus credits: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent("Join Mexive - Get Bonus Credits!");
    const body = encodeURIComponent(`Hey!\n\nI've been using Mexive for AI-powered stock content tools and thought you'd love it too!\n\nUse my referral code: ${referralCode?.code}\n\nOr click this link to sign up: ${referralLink}\n\nYou'll get bonus credits when you join!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!settings?.is_active) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Referral Program Unavailable</h2>
        <p className="text-muted-foreground">
          The referral program is currently disabled. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground">
          Share your code and earn {settings?.referrer_reward_credits || 10} credits for each friend who joins!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReferrals} pending, {stats.completedReferrals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditsEarned}</div>
            <p className="text-xs text-muted-foreground">
              From successful referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Per Referral</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{settings?.referrer_reward_credits || 10}</div>
            <p className="text-xs text-muted-foreground">
              Credits for you & {settings?.referee_reward_credits || 5} for friend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share this code with friends to earn bonus credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Code Display */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Enter new code"
                  maxLength={12}
                  className="font-mono text-lg uppercase"
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveCode}
                  disabled={isUpdatingCode}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3">
                  <code className="text-2xl font-bold tracking-wider">
                    {referralCode?.code || "Loading..."}
                  </code>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setNewCode(referralCode?.code || "");
                    setIsEditing(true);
                  }}
                  title="Customize code"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(referralCode?.code || "", "code")}
                  title="Copy code"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button onClick={handleShare} title="Share">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Referral Link</label>
            <div className="flex items-center gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(referralLink, "link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={shareToTwitter}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" onClick={shareToWhatsApp}>
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={shareToEmail}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            Track your referrals and earned rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Share your code to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      Referral #{referral.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(referral.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={referral.status === "completed" ? "default" : "secondary"}
                    >
                      {referral.status}
                    </Badge>
                    {referral.status === "completed" && (
                      <span className="text-sm font-medium text-green-600">
                        +{referral.referrer_reward_credits} credits
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
