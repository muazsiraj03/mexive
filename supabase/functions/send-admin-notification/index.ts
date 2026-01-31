import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  type: "new_user" | "upgrade_request" | "credit_pack_request";
  userName?: string;
  userEmail?: string;
  planName?: string;
  credits?: number;
  amount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get admin notification email from system settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: emailSetting } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "admin_notification_email")
      .single();

    const adminEmail = emailSetting?.value;
    
    if (!adminEmail) {
      console.log("Admin notification email not configured, skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Admin email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get site name for email branding
    const { data: siteNameSetting } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "site_name")
      .single();
    
    const siteName = siteNameSetting?.value || "Mexive";

    let subject = "";
    let htmlContent = "";

    switch (payload.type) {
      case "new_user":
        subject = `🎉 New User Signup - ${siteName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New User Registered</h1>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${payload.userName || "Not provided"}</p>
              <p style="margin: 0;"><strong>Email:</strong> ${payload.userEmail || "Not provided"}</p>
            </div>
            <p style="color: #666; font-size: 14px;">A new user has signed up on your platform.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated notification from ${siteName}</p>
          </div>
        `;
        break;

      case "upgrade_request":
        subject = `📈 New Upgrade Request - ${siteName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New Plan Upgrade Request</h1>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>User:</strong> ${payload.userName || "Unknown"}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${payload.userEmail || "Unknown"}</p>
              <p style="margin: 0 0 10px 0;"><strong>Requested Plan:</strong> ${payload.planName || "Unknown"}</p>
              ${payload.credits ? `<p style="margin: 0 0 10px 0;"><strong>Credits:</strong> ${payload.credits}</p>` : ""}
              ${payload.amount ? `<p style="margin: 0;"><strong>Amount:</strong> ৳${(payload.amount / 100).toFixed(0)}</p>` : ""}
            </div>
            <p style="color: #666; font-size: 14px;">Please review this request in your admin panel.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated notification from ${siteName}</p>
          </div>
        `;
        break;

      case "credit_pack_request":
        subject = `💳 New Credit Pack Purchase - ${siteName}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New Credit Pack Purchase Request</h1>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>User:</strong> ${payload.userName || "Unknown"}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${payload.userEmail || "Unknown"}</p>
              <p style="margin: 0 0 10px 0;"><strong>Pack:</strong> ${payload.planName || "Unknown"}</p>
              <p style="margin: 0 0 10px 0;"><strong>Credits:</strong> ${payload.credits || 0}</p>
              <p style="margin: 0;"><strong>Amount:</strong> ৳${payload.amount ? (payload.amount / 100).toFixed(0) : 0}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Please review this purchase request in your admin panel.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated notification from ${siteName}</p>
          </div>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${siteName} <onboarding@resend.dev>`,
      to: [adminEmail],
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin notification email sent: ${payload.type} to ${adminEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-admin-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
