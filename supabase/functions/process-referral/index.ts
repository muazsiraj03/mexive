import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referral_code: string;
  referee_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { referral_code, referee_id }: ProcessReferralRequest = await req.json();

    console.log(`Processing referral: code=${referral_code}, referee=${referee_id}`);

    if (!referral_code || !referee_id) {
      return new Response(
        JSON.stringify({ error: "Missing referral_code or referee_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get referral settings
    const { data: settings, error: settingsError } = await supabase
      .from("referral_settings")
      .select("*")
      .single();

    if (settingsError || !settings) {
      console.error("Failed to get referral settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Referral program not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.is_active) {
      console.log("Referral program is disabled");
      return new Response(
        JSON.stringify({ error: "Referral program is currently disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the referral code
    const { data: codeData, error: codeError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", referral_code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (codeError || !codeData) {
      console.error("Invalid referral code:", codeError);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrer_id = codeData.user_id;

    // Prevent self-referral
    if (referrer_id === referee_id) {
      console.log("Self-referral attempt blocked");
      return new Response(
        JSON.stringify({ error: "Cannot use your own referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if referee already has a referral
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referee_id", referee_id)
      .single();

    if (existingReferral) {
      console.log("Referee already has a referral record");
      return new Response(
        JSON.stringify({ error: "User already has a referral" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check referrer's referral count (if limits are set)
    if (settings.max_referrals_per_user) {
      let query = supabase
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("referrer_id", referrer_id)
        .eq("status", "completed");

      // Apply period filter if monthly
      if (settings.cap_period === "monthly") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startOfMonth.toISOString());
      }

      const { count } = await query;

      if (count !== null && count >= settings.max_referrals_per_user) {
        console.log(`Referrer ${referrer_id} has reached referral limit`);
        return new Response(
          JSON.stringify({ error: "Referrer has reached maximum referrals" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create the referral record
    const status = settings.reward_trigger === "signup" ? "completed" : "pending";
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id,
        referee_id,
        referral_code: referral_code.toUpperCase(),
        status,
        referrer_reward_credits: settings.referrer_reward_credits,
        referee_reward_credits: settings.referee_reward_credits,
        rewarded_at: status === "completed" ? new Date().toISOString() : null,
      });

    if (insertError) {
      console.error("Failed to create referral:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to process referral" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If reward trigger is signup, distribute credits immediately
    if (settings.reward_trigger === "signup") {
      // Add credits to referrer
      const { error: referrerError } = await supabase.rpc("increment_bonus_credits", {
        p_user_id: referrer_id,
        p_credits: settings.referrer_reward_credits,
      });

      if (referrerError) {
        console.error("Failed to add credits to referrer:", referrerError);
      }

      // Add credits to referee
      const { error: refereeError } = await supabase.rpc("increment_bonus_credits", {
        p_user_id: referee_id,
        p_credits: settings.referee_reward_credits,
      });

      if (refereeError) {
        console.error("Failed to add credits to referee:", refereeError);
      }

      // Send notifications
      await supabase.from("notifications").insert([
        {
          user_id: referrer_id,
          title: "Referral Successful! 🎉",
          message: `Someone signed up with your code! You earned ${settings.referrer_reward_credits} bonus credits.`,
          type: "success",
          action_url: "/dashboard/referrals",
        },
        {
          user_id: referee_id,
          title: "Welcome Bonus! 🎁",
          message: `You received ${settings.referee_reward_credits} bonus credits from your referral!`,
          type: "success",
          action_url: "/dashboard",
        },
      ]);

      // Get referrer profile and send email notification
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", referrer_id)
        .single();

      // Get referrer's email from auth
      const { data: referrerAuth } = await supabase.auth.admin.getUserById(referrer_id);

      if (referrerAuth?.user?.email || referrer_id) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-user-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "referral_reward",
              userId: referrer_id,
              userEmail: referrerAuth?.user?.email,
              userName: referrerProfile?.full_name || "there",
              credits: settings.referrer_reward_credits,
            }),
          });
          console.log("Referral reward email sent to referrer");
        } catch (emailError) {
          console.error("Failed to send referral reward email:", emailError);
        }
      }

      console.log("Referral processed and rewards distributed");
    } else {
      console.log("Referral created with pending status (first_purchase trigger)");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status,
        message: status === "completed" 
          ? "Referral processed and rewards distributed" 
          : "Referral registered, rewards will be distributed on first purchase"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing referral:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
