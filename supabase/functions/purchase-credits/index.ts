import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { packId, action, purchaseId, senderName, senderAccount, transactionId, notes } = await req.json();

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate the auth token
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      
      if (userError) {
        console.error("Auth error:", userError.message);
      }
      
      if (user) {
        userId = user.id;
        console.log("Authenticated user:", userId);
      }
    }

    if (!userId) {
      console.error("No user ID found - unauthorized");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle admin actions
    if (action === "approve" || action === "reject") {
      // Verify admin role
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

      if (!purchaseId) {
        return new Response(
          JSON.stringify({ error: "Purchase ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the pending purchase
      const { data: purchase } = await supabaseAdmin
        .from("credit_pack_purchases")
        .select("*")
        .eq("id", purchaseId)
        .eq("status", "pending")
        .single();

      if (!purchase) {
        return new Response(
          JSON.stringify({ error: "Pending purchase not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "approve") {
        // Update purchase status
        await supabaseAdmin
          .from("credit_pack_purchases")
          .update({ 
            status: "completed",
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
          })
          .eq("id", purchaseId);

        // Add credits to user's subscription (not profiles)
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("credits_remaining, bonus_credits")
          .eq("user_id", purchase.user_id)
          .single();

        const currentCredits = subscription?.credits_remaining || 0;
        const currentBonus = subscription?.bonus_credits || 0;
        
        await supabaseAdmin
          .from("subscriptions")
          .update({ 
            credits_remaining: currentCredits + purchase.credits,
            bonus_credits: currentBonus + purchase.credits,
          })
          .eq("user_id", purchase.user_id);

        // Create transaction record
        await supabaseAdmin.from("transactions").insert({
          user_id: purchase.user_id,
          amount: purchase.amount,
          type: "credit_pack",
          status: "completed",
          description: `Credit pack purchase: ${purchase.credits} credits`,
        });

        // Notify user
        await supabaseAdmin.from("notifications").insert({
          user_id: purchase.user_id,
          title: "Credit Pack Approved! 🎉",
          message: `Your purchase of ${purchase.credits} credits has been approved and added to your account.`,
          type: "success",
        });

        console.log(`Credit pack ${purchaseId} approved by admin ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Credit pack approved" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Reject - update the purchase
        await supabaseAdmin
          .from("credit_pack_purchases")
          .update({ 
            status: "rejected",
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
          })
          .eq("id", purchaseId);

        // Notify user
        await supabaseAdmin.from("notifications").insert({
          user_id: purchase.user_id,
          title: "Credit Pack Purchase Declined",
          message: `Your credit pack purchase was not approved. Please contact support for more information.`,
          type: "error",
        });

        console.log(`Credit pack ${purchaseId} rejected by admin ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Credit pack rejected" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // User purchase flow
    if (!packId) {
      return new Response(
        JSON.stringify({ error: "Pack ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the credit pack
    const { data: pack, error: packError } = await supabaseAdmin
      .from("credit_packs")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .single();

    if (packError || !pack) {
      return new Response(
        JSON.stringify({ error: "Credit pack not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending purchase
    const { data: existingPurchase } = await supabaseAdmin
      .from("credit_pack_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .single();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "You already have a pending credit pack purchase. Please wait for it to be processed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total credits (including bonus)
    const totalCredits = pack.credits + (pack.bonus_credits || 0);

    // Create purchase record with payment info
    const { data: newPurchase, error: purchaseError } = await supabaseAdmin
      .from("credit_pack_purchases")
      .insert({
        user_id: userId,
        pack_id: pack.id,
        pack_name: pack.name,
        credits: totalCredits,
        amount: pack.price_cents,
        status: "pending",
        sender_name: senderName || null,
        sender_account: senderAccount || null,
        transaction_id: transactionId || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error("Error creating purchase:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to create purchase request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification for user
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Credit Pack Purchase Submitted",
      message: `Your request for ${pack.name} (${totalCredits} credits) has been submitted and is pending approval.`,
      type: "info",
    });

    console.log(`Credit pack purchase created for user ${userId}, pack: ${pack.name}, credits: ${totalCredits}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        purchase: newPurchase,
        message: "Credit pack purchase submitted. Awaiting approval."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Purchase credits error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
