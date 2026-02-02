import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily credit reset job...");

    // Get all plans that have daily credit reset enabled
    const { data: plansWithDailyReset, error: plansError } = await supabase
      .from("pricing_config")
      .select("plan_name, credits")
      .eq("daily_credit_reset", true)
      .eq("is_active", true);

    if (plansError) {
      console.error("Error fetching plans:", plansError);
      throw plansError;
    }

    console.log("Plans with daily reset:", plansWithDailyReset);

    if (!plansWithDailyReset || plansWithDailyReset.length === 0) {
      console.log("No plans with daily credit reset found");
      return new Response(
        JSON.stringify({ message: "No plans with daily credit reset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each plan with daily reset, update all users on that plan
    let totalUpdated = 0;

    for (const plan of plansWithDailyReset) {
      console.log(`Processing plan: ${plan.plan_name} with ${plan.credits} credits`);

      // Find subscriptions on this plan with status 'active'
      // Reset credits for all users on plans with daily reset
      const { data: subsToReset, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, user_id, credits_remaining, credits_total")
        .eq("plan", plan.plan_name)
        .eq("status", "active");

      if (subsError) {
        console.error(`Error fetching subscriptions for plan ${plan.plan_name}:`, subsError);
        continue;
      }

      console.log(`Found ${subsToReset?.length || 0} subscriptions to reset for plan ${plan.plan_name}`);

      if (subsToReset && subsToReset.length > 0) {
        // Reset credits for these subscriptions
        for (const sub of subsToReset) {
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              credits_remaining: plan.credits,
              credits_total: plan.credits,
            })
            .eq("id", sub.id);

          if (updateError) {
            console.error(`Error updating subscription ${sub.id}:`, updateError);
          } else {
            totalUpdated++;
            console.log(`Reset credits for subscription ${sub.id} (user ${sub.user_id}) to ${plan.credits}`);
          }
        }
      }
    }

    console.log(`Daily credit reset complete. Total users updated: ${totalUpdated}`);

    // Check for subscriptions expiring in 7 days and send notifications
    console.log("Checking for expiring subscriptions...");
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStart = new Date(sevenDaysFromNow);
    sevenDaysStart.setHours(0, 0, 0, 0);
    const sevenDaysEnd = new Date(sevenDaysFromNow);
    sevenDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiringSubs, error: expiringError } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, expires_at")
      .eq("status", "active")
      .neq("plan", "free")
      .gte("expires_at", sevenDaysStart.toISOString())
      .lte("expires_at", sevenDaysEnd.toISOString());

    if (expiringError) {
      console.error("Error fetching expiring subscriptions:", expiringError);
    } else if (expiringSubs && expiringSubs.length > 0) {
      console.log(`Found ${expiringSubs.length} subscriptions expiring in 7 days`);

      // Get plan display names
      const { data: planConfigs } = await supabase
        .from("pricing_config")
        .select("plan_name, display_name");

      const planDisplayNames: Record<string, string> = {};
      planConfigs?.forEach(p => {
        planDisplayNames[p.plan_name] = p.display_name;
      });

      for (const sub of expiringSubs) {
        // Get user profile and email
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", sub.user_id)
          .single();

        const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);

        if (authUser?.user?.email) {
          // Send in-app notification
          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            title: "Subscription Expiring Soon ⏰",
            message: `Your ${planDisplayNames[sub.plan] || sub.plan} subscription expires in 7 days. Renew now to keep your benefits!`,
            type: "warning",
            action_url: "/dashboard/subscription",
          });

          // Send email notification
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-user-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "subscription_expiring",
                userId: sub.user_id,
                userEmail: authUser.user.email,
                userName: profile?.full_name || "there",
                planName: planDisplayNames[sub.plan] || sub.plan,
                expiresIn: 7,
              }),
            });
            console.log(`Expiry notification sent to user ${sub.user_id}`);
          } catch (emailError) {
            console.error(`Failed to send expiry email to user ${sub.user_id}:`, emailError);
          }
        }
      }
    } else {
      console.log("No subscriptions expiring in 7 days");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset credits for ${totalUpdated} users. Checked expiring subscriptions.`,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily credit reset error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
