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

interface BrandSettings {
  siteName: string;
  supportEmail: string;
  primaryColor: string;
  adminUrl: string;
}

// Get brand settings from system_settings
async function getBrandSettings(supabase: any): Promise<BrandSettings> {
  const { data: settings } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["app_name", "support_email"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value || "";
  });

  return {
    siteName: settingsMap.app_name || "Mexive",
    supportEmail: settingsMap.support_email || "support@mexive.com",
    primaryColor: "#6366f1",
    adminUrl: "https://mexive.lovable.app/admin",
  };
}

// Generate the admin email wrapper
function getAdminEmailWrapper(content: string, brand: BrandSettings) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${brand.siteName} Admin</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #18181b;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
              
              <!-- Admin Header Badge -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 8px 16px; border-radius: 20px;">
                        <span style="color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          🔔 Admin Notification
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom: 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); padding: 14px 28px; border-radius: 10px;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                          ${brand.siteName}
                        </h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content Card -->
              <tr>
                <td>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #27272a; border-radius: 16px; border: 1px solid #3f3f46;">
                    <tr>
                      <td style="padding: 32px;">
                        ${content}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Admin Footer -->
              <tr>
                <td style="padding-top: 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="${brand.adminUrl}" style="display: inline-block; background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          Open Admin Dashboard →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 24px;">
                        <p style="margin: 0; color: #71717a; font-size: 12px;">
                          This is an automated admin notification from ${brand.siteName}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Get notification content based on type
function getNotificationContent(payload: NotificationPayload, brand: BrandSettings) {
  const labelStyle = `color: #a1a1aa; font-size: 13px; padding-bottom: 4px;`;
  const valueStyle = `color: #fafafa; font-size: 15px; font-weight: 500;`;
  const rowStyle = `padding: 12px 0; border-bottom: 1px solid #3f3f46;`;
  const badgeStyle = `display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;`;

  switch (payload.type) {
    case "new_user":
      return {
        subject: `🎉 New User Signup`,
        content: `
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">👤</span>
            <h2 style="margin: 12px 0 4px 0; color: #fafafa; font-size: 22px; font-weight: 600;">New User Registered</h2>
            <span style="${badgeStyle} background-color: #22c55e; color: #ffffff;">New Signup</span>
          </div>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #3f3f46; border-radius: 10px; padding: 4px;">
            <tr>
              <td style="padding: 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Name</p>
                      <p style="${valueStyle} margin: 0;">${payload.userName || "Not provided"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="${labelStyle} margin: 0;">Email</p>
                      <p style="${valueStyle} margin: 0;">${payload.userEmail || "Not provided"}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin-top: 20px; margin-bottom: 0;">
            A new user has signed up on your platform.
          </p>
        `,
      };

    case "upgrade_request":
      return {
        subject: `📈 New Upgrade Request - ${payload.planName}`,
        content: `
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">📈</span>
            <h2 style="margin: 12px 0 4px 0; color: #fafafa; font-size: 22px; font-weight: 600;">New Upgrade Request</h2>
            <span style="${badgeStyle} background-color: #f59e0b; color: #ffffff;">Pending Review</span>
          </div>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #3f3f46; border-radius: 10px; padding: 4px;">
            <tr>
              <td style="padding: 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">User</p>
                      <p style="${valueStyle} margin: 0;">${payload.userName || "Unknown"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Email</p>
                      <p style="${valueStyle} margin: 0;">${payload.userEmail || "Unknown"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Requested Plan</p>
                      <p style="${valueStyle} margin: 0;">
                        <span style="${badgeStyle} background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); color: #ffffff;">
                          ${payload.planName || "Unknown"}
                        </span>
                      </p>
                    </td>
                  </tr>
                  ${payload.credits ? `
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Credits</p>
                      <p style="${valueStyle} margin: 0;">${payload.credits}</p>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="${labelStyle} margin: 0;">Amount</p>
                      <p style="color: #22c55e; font-size: 20px; font-weight: 700; margin: 0;">
                        ৳${payload.amount ? (payload.amount / 100).toFixed(0) : 0}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="color: #fbbf24; font-size: 13px; text-align: center; margin-top: 20px; margin-bottom: 0;">
            ⚠️ Please review this request in your admin panel.
          </p>
        `,
      };

    case "credit_pack_request":
      return {
        subject: `💳 New Credit Pack Purchase - ${payload.credits} Credits`,
        content: `
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">💳</span>
            <h2 style="margin: 12px 0 4px 0; color: #fafafa; font-size: 22px; font-weight: 600;">Credit Pack Purchase</h2>
            <span style="${badgeStyle} background-color: #3b82f6; color: #ffffff;">Pending Review</span>
          </div>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #3f3f46; border-radius: 10px; padding: 4px;">
            <tr>
              <td style="padding: 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">User</p>
                      <p style="${valueStyle} margin: 0;">${payload.userName || "Unknown"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Email</p>
                      <p style="${valueStyle} margin: 0;">${payload.userEmail || "Unknown"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Pack</p>
                      <p style="${valueStyle} margin: 0;">${payload.planName || "Unknown"}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="${rowStyle}">
                      <p style="${labelStyle} margin: 0;">Credits</p>
                      <p style="color: #3b82f6; font-size: 24px; font-weight: 700; margin: 0;">
                        ${payload.credits || 0}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="${labelStyle} margin: 0;">Amount</p>
                      <p style="color: #22c55e; font-size: 20px; font-weight: 700; margin: 0;">
                        ৳${payload.amount ? (payload.amount / 100).toFixed(0) : 0}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="color: #fbbf24; font-size: 13px; text-align: center; margin-top: 20px; margin-bottom: 0;">
            ⚠️ Please review this purchase request in your admin panel.
          </p>
        `,
      };

    default:
      throw new Error("Invalid notification type");
  }
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

    // Get brand settings
    const brand = await getBrandSettings(supabaseAdmin);

    // Get notification content
    const { subject, content } = getNotificationContent(payload, brand);

    // Wrap content in branded admin template
    const html = getAdminEmailWrapper(content, brand);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${brand.siteName} <onboarding@resend.dev>`,
      to: [adminEmail],
      subject: `[${brand.siteName}] ${subject}`,
      html,
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
