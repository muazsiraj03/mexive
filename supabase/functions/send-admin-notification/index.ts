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
    .in("key", ["app_name", "support_email", "website_url"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value || "";
  });

  const baseUrl = settingsMap.website_url || "https://mexive.lovable.app";

  return {
    siteName: settingsMap.app_name || "Mexive",
    supportEmail: settingsMap.support_email || "support@mexive.com",
    primaryColor: "#6366f1",
    adminUrl: `${baseUrl}/admin`,
  };
}

// Icon circle for admin emails
function getIconCircle(icon: string, brand: BrandSettings): string {
  const iconMap: Record<string, string> = {
    user: "👤",
    upgrade: "📈",
    credits: "💳",
    bell: "🔔",
  };
  
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
      <tr>
        <td style="width: 64px; height: 64px; background-color: ${brand.primaryColor}15; border-radius: 50%; text-align: center; vertical-align: middle;">
          <span style="font-size: 28px; line-height: 64px;">${iconMap[icon] || "📧"}</span>
        </td>
      </tr>
    </table>
  `;
}

// Generate the admin email wrapper - clean minimalist design
function getAdminEmailWrapper(content: string, brand: BrandSettings) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${brand.siteName} Admin</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
              
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 12px 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="width: 32px; height: 32px; background-color: ${brand.primaryColor}; border-radius: 8px; text-align: center; vertical-align: middle;">
                              <span style="color: #ffffff; font-size: 16px; font-weight: 700; line-height: 32px;">M</span>
                            </td>
                            <td style="padding-left: 10px;">
                              <span style="font-size: 20px; font-weight: 700; color: #1f2937; letter-spacing: -0.5px;">${brand.siteName}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content Card -->
              <tr>
                <td>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 48px 40px;">
                        ${content}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <!-- Admin Link -->
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                          If you have additional questions, please refer to the 
                          <a href="${brand.adminUrl}" style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;">Admin Dashboard</a>.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Disclaimer -->
                    <tr>
                      <td align="center" style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                          Please do not reply to this email. This mailbox is not monitored.
                          <br>This is an automated admin notification from ${brand.siteName}.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Copyright -->
                    <tr>
                      <td align="center">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          Copyright © ${new Date().getFullYear()} ${brand.siteName}. All rights reserved.
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
  const textStyle = `color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;`;
  const labelStyle = `color: #6b7280; font-size: 13px; margin: 0 0 4px 0;`;
  const valueStyle = `color: #1f2937; font-size: 15px; font-weight: 500; margin: 0 0 16px 0;`;
  const buttonStyle = `display: inline-block; background-color: ${brand.primaryColor}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;`;
  const linkStyle = `color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;`;
  const badgeStyle = `display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;`;

  switch (payload.type) {
    case "new_user":
      return {
        subject: `New User Signup`,
        content: `
          ${getIconCircle("user", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            New User Registered
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear Admin,</strong>
          </p>
          
          <p style="${textStyle}">
            A new user has signed up on ${brand.siteName}. Here are the details:
          </p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="${labelStyle}">Name</p>
            <p style="${valueStyle}">${payload.userName || "Not provided"}</p>
            
            <p style="${labelStyle}">Email</p>
            <p style="${valueStyle} margin-bottom: 0;">${payload.userEmail || "Not provided"}</p>
          </div>
          
          <div style="text-align: center; margin: 8px 0 32px 0;">
            <span style="${badgeStyle} background-color: #dcfce7; color: #166534;">New Signup</span>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${brand.adminUrl}/users" style="${buttonStyle}">
              View in Admin
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px;">
            Can't see the button? Use the link: <a href="${brand.adminUrl}/users" style="${linkStyle}">[link here]</a>
          </p>
        `,
      };

    case "upgrade_request":
      return {
        subject: `New Upgrade Request - ${payload.planName}`,
        content: `
          ${getIconCircle("upgrade", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            New Upgrade Request
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear Admin,</strong>
          </p>
          
          <p style="${textStyle}">
            A user has submitted an upgrade request. Please review the payment details below:
          </p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="${labelStyle}">User</p>
            <p style="${valueStyle}">${payload.userName || "Unknown"}</p>
            
            <p style="${labelStyle}">Email</p>
            <p style="${valueStyle}">${payload.userEmail || "Unknown"}</p>
            
            <p style="${labelStyle}">Requested Plan</p>
            <p style="${valueStyle}">${payload.planName || "Unknown"}</p>
            
            ${payload.credits ? `
            <p style="${labelStyle}">Credits</p>
            <p style="${valueStyle}">${payload.credits}</p>
            ` : ''}
            
            <p style="${labelStyle}">Amount</p>
            <p style="color: #059669; font-size: 20px; font-weight: 700; margin: 0;">
              ৳${payload.amount ? (payload.amount / 100).toFixed(0) : 0}
            </p>
          </div>
          
          <div style="text-align: center; margin: 8px 0 32px 0;">
            <span style="${badgeStyle} background-color: #fef3c7; color: #92400e;">Pending Review</span>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${brand.adminUrl}/upgrade-requests" style="${buttonStyle}">
              Review Request
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px;">
            Can't see the button? Use the link: <a href="${brand.adminUrl}/upgrade-requests" style="${linkStyle}">[link here]</a>
          </p>
        `,
      };

    case "credit_pack_request":
      return {
        subject: `New Credit Pack Purchase - ${payload.credits} Credits`,
        content: `
          ${getIconCircle("credits", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Credit Pack Purchase Request
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear Admin,</strong>
          </p>
          
          <p style="${textStyle}">
            A user has submitted a credit pack purchase request. Please review the payment details below:
          </p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="${labelStyle}">User</p>
            <p style="${valueStyle}">${payload.userName || "Unknown"}</p>
            
            <p style="${labelStyle}">Email</p>
            <p style="${valueStyle}">${payload.userEmail || "Unknown"}</p>
            
            <p style="${labelStyle}">Pack</p>
            <p style="${valueStyle}">${payload.planName || "Unknown"}</p>
            
            <p style="${labelStyle}">Credits</p>
            <p style="color: ${brand.primaryColor}; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">
              ${payload.credits || 0}
            </p>
            
            <p style="${labelStyle}">Amount</p>
            <p style="color: #059669; font-size: 20px; font-weight: 700; margin: 0;">
              ৳${payload.amount ? (payload.amount / 100).toFixed(0) : 0}
            </p>
          </div>
          
          <div style="text-align: center; margin: 8px 0 32px 0;">
            <span style="${badgeStyle} background-color: #dbeafe; color: #1e40af;">Pending Review</span>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${brand.adminUrl}/credit-pack-purchases" style="${buttonStyle}">
              Review Purchase
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px;">
            Can't see the button? Use the link: <a href="${brand.adminUrl}/credit-pack-purchases" style="${linkStyle}">[link here]</a>
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
