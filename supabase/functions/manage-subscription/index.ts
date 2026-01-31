import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback plan configuration (used if DB fetch fails)
const FALLBACK_PLAN_CONFIG = {
  free: { credits: 5, price: 0, unlimited: false },
  pro: { credits: 100, price: 1900, unlimited: false },
  enterprise: { credits: 500, price: 4900, unlimited: false },
  unlimited: { credits: 0, price: 9900, unlimited: true },
};

// Helper to get plan config from database or fallback
async function getPlanConfig(supabase: any, planName: string) {
  try {
    const { data, error } = await supabase
      .from("pricing_config")
      .select("credits, price_cents, is_unlimited")
      .eq("plan_name", planName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.log(`Using fallback config for plan: ${planName}`);
      return FALLBACK_PLAN_CONFIG[planName as keyof typeof FALLBACK_PLAN_CONFIG] || FALLBACK_PLAN_CONFIG.free;
    }

    return { 
      credits: data.credits, 
      price: data.price_cents, 
      unlimited: data.is_unlimited || false 
    };
  } catch {
    return FALLBACK_PLAN_CONFIG[planName as keyof typeof FALLBACK_PLAN_CONFIG] || FALLBACK_PLAN_CONFIG.free;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, plan, subscriptionId, requestedCredits, requestedPriceCents, billingPeriod } = await req.json();

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // For user actions, validate the auth token
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
      
      if (!claimsError && claims?.claims?.sub) {
        userId = claims.claims.sub as string;
      }
    }

    switch (action) {
      case "subscribe": {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate plan against database
        if (!plan) {
          return new Response(
            JSON.stringify({ error: "Plan is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if plan exists in pricing_config
        const { data: planData, error: planError } = await supabaseAdmin
          .from("pricing_config")
          .select("plan_name")
          .eq("plan_name", plan)
          .eq("is_active", true)
          .single();

        if (planError || !planData) {
          console.error(`Invalid plan requested: ${plan}`);
          return new Response(
            JSON.stringify({ error: "Invalid plan" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for existing pending subscription
        const { data: pendingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, status, plan")
          .eq("user_id", userId)
          .eq("status", "pending")
          .single();

        if (pendingSub) {
          return new Response(
            JSON.stringify({ error: "You already have a pending subscription request. Please wait for it to be processed." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for existing active subscription (for upgrade/change requests)
        const { data: activeSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, status, plan")
          .eq("user_id", userId)
          .eq("status", "active")
          .single();

        // Allow upgrade requests even if user has active subscription

        // Calculate expiration (1 month from now)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Build subscription data with optional tier info
        const subscriptionData: Record<string, any> = {
          user_id: userId,
          plan: plan,
          status: "pending",
          expires_at: expiresAt.toISOString(),
        };

        // Add selected tier if provided
        if (requestedCredits) {
          subscriptionData.requested_credits = requestedCredits;
        }
        if (requestedPriceCents) {
          subscriptionData.requested_price_cents = requestedPriceCents;
        }

        // Create pending subscription
        const { data: newSub, error: subError } = await supabaseAdmin
          .from("subscriptions")
          .insert(subscriptionData)
          .select()
          .single();

        if (subError) {
          console.error("Error creating subscription:", subError);
          return new Response(
            JSON.stringify({ error: "Failed to create subscription request" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build notification message with tier info if present
        const tierInfo = requestedCredits ? ` (${requestedCredits} credits at $${(requestedPriceCents / 100).toFixed(0)}/mo)` : "";
        const upgradeNote = activeSub ? " This will replace your current subscription when approved." : "";

        // Create notification for user
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: activeSub ? "Upgrade Request Submitted" : "Subscription Request Submitted",
          message: `Your request for the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan${tierInfo} has been submitted and is pending approval.${upgradeNote}`,
          type: "info",
        });

        console.log(`Subscription request created for user ${userId}, plan: ${plan}, credits: ${requestedCredits || 'default'}, price: ${requestedPriceCents || 'default'}, isUpgrade: ${!!activeSub}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: newSub,
            message: "Subscription request submitted. Awaiting approval."
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find active subscription
        const { data: activeSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan, expires_at")
          .eq("user_id", userId)
          .eq("status", "active")
          .single();

        if (!activeSub) {
          return new Response(
            JSON.stringify({ error: "No active subscription to cancel" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update to canceled (keeps access until expires_at)
        const { error: cancelError } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("id", activeSub.id);

        if (cancelError) {
          console.error("Error canceling subscription:", cancelError);
          return new Response(
            JSON.stringify({ error: "Failed to cancel subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Notify user
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Subscription Canceled",
          message: `Your ${activeSub.plan} subscription has been canceled. You'll retain access until ${new Date(activeSub.expires_at).toLocaleDateString()}.`,
          type: "warning",
        });

        console.log(`Subscription ${activeSub.id} canceled for user ${userId}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Subscription canceled. Access continues until ${new Date(activeSub.expires_at).toLocaleDateString()}.`
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "approve": {
        // Admin action - verify admin role
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!subscriptionId) {
          return new Response(
            JSON.stringify({ error: "Subscription ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the pending subscription
        const { data: pendingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, plan, status, requested_credits, requested_price_cents")
          .eq("id", subscriptionId)
          .eq("status", "pending")
          .single();

        if (!pendingSub) {
          return new Response(
            JSON.stringify({ error: "Pending subscription not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if this is an upgrade (user has another active subscription)
        const { data: existingActiveSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", pendingSub.user_id)
          .eq("status", "active")
          .neq("id", subscriptionId)
          .single();

        // If upgrading, expire the old subscription
        if (existingActiveSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", existingActiveSub.id);
          
          console.log(`Expired old subscription ${existingActiveSub.id} for upgrade`);
        }

        // Use requested credits/price if specified, otherwise fall back to plan defaults
        const planConfig = await getPlanConfig(supabaseAdmin, pendingSub.plan);
        const isUnlimitedPlan = pendingSub.plan === "unlimited" || planConfig.unlimited;
        const creditsToGrant = isUnlimitedPlan ? 0 : (pendingSub.requested_credits || planConfig.credits);
        const priceCharged = pendingSub.requested_price_cents || planConfig.price;

        // Activate subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "active", 
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString()
          })
          .eq("id", subscriptionId);

        // Update user's profile with new plan and credits (or unlimited flag)
        await supabaseAdmin
          .from("profiles")
          .update({ 
            plan: pendingSub.plan,
            credits: creditsToGrant,
            total_credits: creditsToGrant,
            has_unlimited_credits: isUnlimitedPlan
          })
          .eq("id", pendingSub.user_id);

        // Create transaction record
        await supabaseAdmin.from("transactions").insert({
          user_id: pendingSub.user_id,
          amount: priceCharged,
          type: "subscription",
          status: "completed",
          description: `${pendingSub.plan.charAt(0).toUpperCase() + pendingSub.plan.slice(1)} plan subscription (${creditsToGrant} credits)`,
        });

        // Notify user
        const creditsMessage = isUnlimitedPlan 
          ? "You now have unlimited credits!" 
          : `You have ${creditsToGrant} credits available.`;
        await supabaseAdmin.from("notifications").insert({
          user_id: pendingSub.user_id,
          title: "Subscription Approved! 🎉",
          message: `Your ${pendingSub.plan} subscription is now active! ${creditsMessage}`,
          type: "success",
        });

        console.log(`Subscription ${subscriptionId} approved by admin ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Subscription approved" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reject": {
        // Admin action
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!subscriptionId) {
          return new Response(
            JSON.stringify({ error: "Subscription ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get and delete the pending subscription
        const { data: pendingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, plan")
          .eq("id", subscriptionId)
          .eq("status", "pending")
          .single();

        if (!pendingSub) {
          return new Response(
            JSON.stringify({ error: "Pending subscription not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabaseAdmin
          .from("subscriptions")
          .delete()
          .eq("id", subscriptionId);

        // Notify user
        await supabaseAdmin.from("notifications").insert({
          user_id: pendingSub.user_id,
          title: "Subscription Request Declined",
          message: `Your request for the ${pendingSub.plan} plan was not approved. Please contact support for more information.`,
          type: "error",
        });

        console.log(`Subscription ${subscriptionId} rejected by admin ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Subscription rejected" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check-expiration": {
        // This should be called by a cron job
        // Find all expired or canceled subscriptions past their expiration date
        const now = new Date().toISOString();

        const { data: expiredSubs } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, plan")
          .in("status", ["active", "canceled"])
          .lt("expires_at", now);

        if (!expiredSubs || expiredSubs.length === 0) {
          console.log("No expired subscriptions found");
          return new Response(
            JSON.stringify({ success: true, processed: 0 }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Found ${expiredSubs.length} expired subscriptions`);

        for (const sub of expiredSubs) {
          // Update subscription status
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("id", sub.id);

          // Get free plan config
          const freeConfig = await getPlanConfig(supabaseAdmin, "free");
          
          // Downgrade user to free plan (and remove unlimited status)
          await supabaseAdmin
            .from("profiles")
            .update({ 
              plan: "free",
              credits: freeConfig.credits,
              total_credits: freeConfig.credits,
              has_unlimited_credits: false
            })
            .eq("id", sub.user_id);

          // Notify user
          await supabaseAdmin.from("notifications").insert({
            user_id: sub.user_id,
            title: "Subscription Expired",
            message: `Your ${sub.plan} subscription has expired. You've been moved to the Free plan with ${freeConfig.credits} credits.`,
            type: "warning",
          });

          console.log(`Expired subscription ${sub.id} for user ${sub.user_id}`);
        }

        return new Response(
          JSON.stringify({ success: true, processed: expiredSubs.length }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Manage subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
