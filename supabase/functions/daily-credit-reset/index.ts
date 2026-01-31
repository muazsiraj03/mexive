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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reset credits for ${totalUpdated} users`,
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
