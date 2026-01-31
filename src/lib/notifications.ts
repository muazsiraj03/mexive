import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "info" | "success" | "warning" | "error" | "system";

export interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
}

/**
 * Create a notification for a specific user
 */
export async function notifyUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      action_url: payload.actionUrl || null,
      is_global: false,
      created_by: user?.id || null,
    });

    if (error) {
      console.error("Failed to create notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Notification error:", err);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Create a self-notification (for the current user)
 */
export async function notifySelf(
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    return notifyUser(user.id, payload);
  } catch (err) {
    console.error("Self notification error:", err);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Notify all admin users
 * This should be called from an edge function with service role access
 */
export async function notifyAdmins(
  payload: NotificationPayload,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api/notify-admins`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to notify admins" };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin notification error:", err);
    return { success: false, error: "Failed to notify admins" };
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  // User -> Admin notifications
  upgradeRequestSubmitted: (planName: string) => ({
    title: "New Upgrade Request",
    message: `A user has submitted an upgrade request for the ${planName} plan.`,
    type: "info" as NotificationType,
    actionUrl: "/admin/upgrade-requests",
  }),

  creditPackPurchaseSubmitted: (packName: string, credits: number) => ({
    title: "New Credit Pack Purchase",
    message: `A user has submitted a purchase request for ${packName} (${credits} credits).`,
    type: "info" as NotificationType,
    actionUrl: "/admin/credit-pack-purchases",
  }),

  // Admin -> User notifications
  upgradeRequestApproved: (planName: string, credits: number) => ({
    title: "Upgrade Request Approved! 🎉",
    message: `Your upgrade to the ${planName} plan has been approved. You have ${credits} credits available.`,
    type: "success" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  upgradeRequestRejected: (adminNotes?: string) => ({
    title: "Upgrade Request Declined",
    message: adminNotes || "Your upgrade request was not approved. Please contact support for more information.",
    type: "error" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  creditPackApproved: (credits: number) => ({
    title: "Credit Pack Approved! 🎉",
    message: `Your purchase of ${credits} credits has been approved and added to your account.`,
    type: "success" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  creditPackRejected: (adminNotes?: string) => ({
    title: "Credit Pack Purchase Declined",
    message: adminNotes || "Your credit pack purchase was not approved. Please contact support for more information.",
    type: "error" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  // Referral notifications
  referralRewardEarned: (credits: number) => ({
    title: "Referral Reward! 🎁",
    message: `You've earned ${credits} bonus credits from a successful referral.`,
    type: "success" as NotificationType,
    actionUrl: "/dashboard/referrals",
  }),

  referralSignupBonus: (credits: number) => ({
    title: "Welcome Bonus! 🎉",
    message: `You've received ${credits} bonus credits for signing up with a referral code.`,
    type: "success" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  // Self notifications
  subscriptionExpiring: (daysLeft: number) => ({
    title: "Subscription Expiring Soon",
    message: `Your subscription will expire in ${daysLeft} days. Renew to keep your benefits.`,
    type: "warning" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),

  creditsLow: (remaining: number) => ({
    title: "Credits Running Low",
    message: `You have ${remaining} credits remaining. Consider purchasing more to continue using the tools.`,
    type: "warning" as NotificationType,
    actionUrl: "/dashboard/subscription",
  }),
};
