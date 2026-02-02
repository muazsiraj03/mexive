import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType = 
  | "welcome"
  | "upgrade_approved"
  | "upgrade_rejected"
  | "credit_pack_approved"
  | "credit_pack_rejected"
  | "referral_reward"
  | "subscription_expiring";

interface EmailPayload {
  type: EmailType;
  userEmail?: string;
  userId?: string; // Can provide userId instead of userEmail - will look up from auth
  userName?: string;
  planName?: string;
  credits?: number;
  amount?: number;
  adminNotes?: string;
  expiresIn?: number;
  dashboardUrl?: string;
}

interface BrandSettings {
  siteName: string;
  supportEmail: string;
  primaryColor: string;
  websiteUrl: string;
  whatsappNumber: string;
}

// Get brand settings from system_settings
async function getBrandSettings(supabase: any): Promise<BrandSettings> {
  const { data: settings } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["app_name", "support_email", "whatsapp_number", "website_url"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value || "";
  });

  return {
    siteName: settingsMap.app_name || "Mexive",
    supportEmail: settingsMap.support_email || "support@mexive.com",
    primaryColor: "#6366f1",
    websiteUrl: settingsMap.website_url || "https://mexive.lovable.app",
    whatsappNumber: settingsMap.whatsapp_number || "",
  };
}

// Icon SVGs for email (embedded as data URIs for email compatibility)
function getIconCircle(icon: string, brand: BrandSettings): string {
  const iconMap: Record<string, string> = {
    welcome: "🎉",
    upgrade: "📈",
    credits: "💳",
    gift: "🎁",
    clock: "⏰",
    mail: "✉️",
    check: "✓",
    info: "ℹ️",
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

// Generate the branded email wrapper - clean minimalist design
function getEmailWrapper(content: string, brand: BrandSettings) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${brand.siteName}</title>
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
                    <!-- Support Link -->
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                          If you have additional questions, please refer to the 
                          <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;">Support Service</a>.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Disclaimer -->
                    <tr>
                      <td align="center" style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                          Please do not reply to this email. This mailbox is not monitored, and we are not able to respond.
                          <br>For assistance, please visit our Support Service or write to this address: 
                          <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none;">${brand.supportEmail}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Unsubscribe & Settings -->
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          To unsubscribe from receiving emails from ${brand.siteName} or to modify
                          <br>your notification settings, visit the Notifications page.
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

// Get email content based on type
function getEmailContent(payload: EmailPayload, brand: BrandSettings) {
  const { type, userName, planName, credits, adminNotes, expiresIn } = payload;
  const dashboardUrl = payload.dashboardUrl || `${brand.websiteUrl}/dashboard`;
  
  const buttonStyle = `display: inline-block; background-color: ${brand.primaryColor}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;`;
  const linkStyle = `color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;`;
  const textStyle = `color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;`;
  const signatureStyle = `color: #374151; font-size: 15px; margin-top: 32px;`;

  switch (type) {
    case "welcome":
      return {
        subject: `Welcome to ${brand.siteName}!`,
        content: `
          ${getIconCircle("welcome", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Welcome to ${brand.siteName}!
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            Your email address has been used for account registration at our website 
            <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a>.
          </p>
          
          <p style="${textStyle}">
            Thank you for choosing ${brand.siteName} as your creative partner! You now have access to powerful AI tools 
            to generate metadata, convert images to prompts, and review files for marketplace compliance.
          </p>
          
          ${credits ? `
          <p style="${textStyle}">
            As a welcome gift, we've added <strong>${credits} free credits</strong> to your account to get you started.
          </p>
          ` : ''}
          
          <p style="${textStyle}">
            If that was indeed your intention and you wish to start creating, please click on the button below.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Get Started
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? Use the link: <a href="${dashboardUrl}" style="${linkStyle}">[link here]</a>
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "upgrade_approved":
      return {
        subject: `Your ${planName} Plan is Now Active!`,
        content: `
          ${getIconCircle("upgrade", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Upgrade Approved!
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            Great news! Your upgrade request for the <strong>${planName}</strong> plan has been approved and is now active 
            on your account at <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a>.
          </p>
          
          <p style="${textStyle}">
            Your account has been credited with <strong>${credits ? credits : 'unlimited'} credits</strong>. 
            You can now enjoy all the premium features included in your plan.
          </p>
          
          <p style="${textStyle}">
            To start using your new plan, please click on the button below.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Go to Dashboard
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? Use the link: <a href="${dashboardUrl}" style="${linkStyle}">[link here]</a>
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "upgrade_rejected":
      return {
        subject: `Update on Your Upgrade Request`,
        content: `
          ${getIconCircle("info", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Upgrade Request Update
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            We've reviewed your upgrade request for the <strong>${planName}</strong> plan on your account 
            at <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a>.
          </p>
          
          <p style="${textStyle}">
            Unfortunately, we were unable to approve your request at this time.
          </p>
          
          ${adminNotes ? `
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>Reason:</strong> ${adminNotes}
            </p>
          </div>
          ` : ''}
          
          <p style="${textStyle}">
            If you believe this was a mistake or need assistance, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${brand.supportEmail}" style="${buttonStyle}">
              Contact Support
            </a>
          </div>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "credit_pack_approved":
      return {
        subject: `Your Credits Have Been Added!`,
        content: `
          ${getIconCircle("credits", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Credits Added Successfully!
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            Your credit pack purchase has been approved. We've added <strong>${credits} credits</strong> to your account 
            at <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a>.
          </p>
          
          <p style="${textStyle}">
            Your new credits are now available and ready to use. Happy creating!
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Use Your Credits
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? Use the link: <a href="${dashboardUrl}" style="${linkStyle}">[link here]</a>
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "credit_pack_rejected":
      return {
        subject: `Update on Your Credit Pack Purchase`,
        content: `
          ${getIconCircle("info", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Credit Pack Update
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            We've reviewed your credit pack purchase request. Unfortunately, we were unable to approve your purchase at this time.
          </p>
          
          ${adminNotes ? `
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>Reason:</strong> ${adminNotes}
            </p>
          </div>
          ` : ''}
          
          <p style="${textStyle}">
            If you have questions or believe this was an error, please contact our support team.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${brand.supportEmail}" style="${buttonStyle}">
              Contact Support
            </a>
          </div>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "referral_reward":
      return {
        subject: `You Earned ${credits} Bonus Credits!`,
        content: `
          ${getIconCircle("gift", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Referral Reward Earned!
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            Great news! Someone you referred has signed up on 
            <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a> 
            and you've earned bonus credits as a thank you!
          </p>
          
          <div style="text-align: center; background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 4px 0; color: #059669; font-size: 14px;">Bonus Credits Earned</p>
            <p style="margin: 0; color: #047857; font-size: 36px; font-weight: 700;">+${credits}</p>
          </div>
          
          <p style="${textStyle}">
            Keep sharing your referral link to earn more rewards!
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}/referrals" style="${buttonStyle}">
              View Referrals
            </a>
          </div>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "subscription_expiring":
      return {
        subject: `Your Subscription Expires in ${expiresIn} Days`,
        content: `
          ${getIconCircle("clock", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Subscription Expiring Soon
          </h1>
          
          <p style="${textStyle}">
            <strong>Dear ${userName || "Valued User"},</strong>
          </p>
          
          <p style="${textStyle}">
            Your <strong>${planName}</strong> subscription on 
            <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.websiteUrl}</a> 
            will expire in <strong>${expiresIn} days</strong>.
          </p>
          
          <p style="${textStyle}">
            To continue enjoying unlimited access to all features, please renew your subscription before it expires.
          </p>
          
          <p style="${textStyle}">
            Please note that after expiration, you will lose access to premium features until you renew.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}/subscription" style="${buttonStyle}">
              Renew Subscription
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? Use the link: <a href="${dashboardUrl}/subscription" style="${linkStyle}">[link here]</a>
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    
    // Get system settings for branding (need supabaseAdmin early to look up user email)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve user email - either from payload or by looking up from userId
    let userEmail = payload.userEmail;
    if (!userEmail && payload.userId) {
      console.log(`Looking up email for userId: ${payload.userId}`);
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(payload.userId);
      if (userError) {
        console.error("Error looking up user:", userError);
      } else if (userData?.user?.email) {
        userEmail = userData.user.email;
        console.log(`Found email: ${userEmail}`);
      }
    }
    
    if (!userEmail) {
      console.error("No user email provided and could not look up from userId");
      return new Response(
        JSON.stringify({ error: "User email is required (provide userEmail or valid userId)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get brand settings
    const brand = await getBrandSettings(supabaseAdmin);

    // Get email content
    const { subject, content } = getEmailContent(payload, brand);

    // Wrap content in branded template
    const html = getEmailWrapper(content, brand);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${brand.siteName} <onboarding@resend.dev>`,
      to: [userEmail],
      subject,
      html,
    });

    if (emailError) {
      console.error("Failed to send user email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User email sent: ${payload.type} to ${payload.userEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-user-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
