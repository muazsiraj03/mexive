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
      // Get the start of the current day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find users on this plan who haven't been reset today
      const { data: usersToReset, error: usersError } = await supabase
        .from("profiles")
        .select("id, credits, total_credits")
        .eq("plan", plan.plan_name)
        .eq("has_unlimited_credits", false)
        .lt("last_credit_reset", todayStart.toISOString());

      if (usersError) {
        console.error(`Error fetching users for plan ${plan.plan_name}:`, usersError);
        continue;
      }

      console.log(`Found ${usersToReset?.length || 0} users to reset for plan ${plan.plan_name}`);

      if (usersToReset && usersToReset.length > 0) {
        // Reset credits for these users
        const userIds = usersToReset.map((u) => u.id);

        const { error: updateError, count } = await supabase
          .from("profiles")
          .update({
            credits: plan.credits,
            total_credits: plan.credits,
            last_credit_reset: new Date().toISOString(),
          })
          .in("id", userIds);

        if (updateError) {
          console.error(`Error updating users for plan ${plan.plan_name}:`, updateError);
        } else {
          totalUpdated += usersToReset.length;
          console.log(`Reset credits for ${usersToReset.length} users on ${plan.plan_name} plan`);
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
