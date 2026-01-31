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
  userEmail: string;
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
  tagline: string;
  primaryColor: string;
  logoUrl: string;
  websiteUrl: string;
  whatsappNumber: string;
}

// Get brand settings from system_settings
async function getBrandSettings(supabase: any): Promise<BrandSettings> {
  const { data: settings } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["app_name", "support_email", "whatsapp_number"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value || "";
  });

  return {
    siteName: settingsMap.app_name || "Mexive",
    supportEmail: settingsMap.support_email || "support@mexive.com",
    tagline: "AI-Powered Metadata for Stock Contributors",
    primaryColor: "#6366f1",
    logoUrl: "https://mexive.lovable.app/og-image.png",
    websiteUrl: "https://mexive.lovable.app",
    whatsappNumber: settingsMap.whatsapp_number || "",
  };
}

// Generate the branded email wrapper
function getEmailWrapper(content: string, brand: BrandSettings) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${brand.siteName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
              
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding-bottom: 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); padding: 16px 32px; border-radius: 12px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
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
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <tr>
                      <td style="padding: 40px;">
                        ${content}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Branded Footer Signature -->
              <tr>
                <td style="padding-top: 32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <!-- Divider -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Company Info -->
                    <tr>
                      <td align="center">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding-bottom: 16px;">
                              <span style="display: inline-block; background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); padding: 8px 20px; border-radius: 8px;">
                                <span style="color: #ffffff; font-size: 18px; font-weight: 600;">${brand.siteName}</span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-bottom: 16px;">
                              <p style="margin: 0; color: #6b7280; font-size: 14px; font-style: italic;">
                                ${brand.tagline}
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-bottom: 20px;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <!-- Website -->
                                  <td style="padding: 0 12px;">
                                    <a href="${brand.websiteUrl}" style="color: ${brand.primaryColor}; text-decoration: none; font-size: 13px;">
                                      🌐 Website
                                    </a>
                                  </td>
                                  <!-- Email -->
                                  <td style="padding: 0 12px;">
                                    <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none; font-size: 13px;">
                                      ✉️ ${brand.supportEmail}
                                    </a>
                                  </td>
                                  ${brand.whatsappNumber ? `
                                  <!-- WhatsApp -->
                                  <td style="padding: 0 12px;">
                                    <a href="https://wa.me/${brand.whatsappNumber.replace(/[^0-9]/g, '')}" style="color: ${brand.primaryColor}; text-decoration: none; font-size: 13px;">
                                      💬 WhatsApp
                                    </a>
                                  </td>
                                  ` : ''}
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Legal Footer -->
                    <tr>
                      <td align="center" style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} ${brand.siteName}. All rights reserved.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                          This email was sent to you because you have an account with ${brand.siteName}.
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
  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const dashboardUrl = payload.dashboardUrl || "https://mexive.lovable.app/dashboard";
  
  const buttonStyle = `display: inline-block; background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);`;
  const infoBoxStyle = `background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid ${brand.primaryColor};`;
  const highlightStyle = `display: inline-block; background: linear-gradient(135deg, ${brand.primaryColor} 0%, #8b5cf6 100%); color: #ffffff; padding: 4px 12px; border-radius: 6px; font-weight: 600;`;

  switch (type) {
    case "welcome":
      return {
        subject: `Welcome to ${brand.siteName}! 🎉`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">🎉</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Welcome to ${brand.siteName}!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">Your account is ready to go</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for joining ${brand.siteName}! We're thrilled to have you on board. Here's what you can do:
          </p>
          
          <div style="${infoBoxStyle}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="font-size: 20px; margin-right: 12px;">🖼️</span>
                  <strong style="color: #1f2937;">Generate Metadata</strong>
                  <span style="color: #6b7280;"> — AI-powered titles, descriptions & keywords</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="font-size: 20px; margin-right: 12px;">✨</span>
                  <strong style="color: #1f2937;">Image to Prompt</strong>
                  <span style="color: #6b7280;"> — Convert images into detailed AI prompts</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="font-size: 20px; margin-right: 12px;">📋</span>
                  <strong style="color: #1f2937;">File Reviewer</strong>
                  <span style="color: #6b7280;"> — Check files for marketplace compliance</span>
                </td>
              </tr>
            </table>
          </div>
          
          ${credits ? `
          <div style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 4px 0; color: #059669; font-size: 14px; font-weight: 500;">🎁 Welcome Bonus</p>
            <p style="margin: 0; color: #047857; font-size: 32px; font-weight: 700;">${credits} Free Credits</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Get Started →
            </a>
          </div>
        `,
      };

    case "upgrade_approved":
      return {
        subject: `Your ${planName} Plan is Now Active! 🚀`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">🚀</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Upgrade Approved!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">Your new plan is now active</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Great news! Your upgrade to the <strong>${planName}</strong> plan has been approved and is now active.
          </p>
          
          <div style="${infoBoxStyle}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #6b7280;">Plan:</span>
                  <span style="${highlightStyle} margin-left: 8px;">${planName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #6b7280;">Credits:</span>
                  <strong style="color: #1f2937; margin-left: 8px;">${credits ? credits : 'Unlimited'}</strong>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your new credits are ready to use. Start creating amazing metadata for your content!
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Start Using Your Credits →
            </a>
          </div>
        `,
      };

    case "upgrade_rejected":
      return {
        subject: `Update on Your Upgrade Request`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">📋</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Upgrade Request Update</h1>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We've reviewed your upgrade request for the <strong>${planName}</strong> plan. Unfortunately, we were unable to approve your request at this time.
          </p>
          
          ${adminNotes ? `
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 600;">📝 Reason:</p>
            <p style="margin: 0; color: #92400e; line-height: 1.6;">${adminNotes}</p>
          </div>
          ` : ''}
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you believe this was a mistake or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="mailto:${brand.supportEmail}" style="${buttonStyle}">
              Contact Support
            </a>
          </div>
        `,
      };

    case "credit_pack_approved":
      return {
        subject: `Your Credits Have Been Added! 💳`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">💳</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Credits Added!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">Your purchase has been approved</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Your credit pack purchase has been approved and your account has been credited!
          </p>
          
          <div style="text-align: center; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; padding: 32px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #3b82f6; font-size: 14px; font-weight: 500;">Credits Added</p>
            <p style="margin: 0; color: #1d4ed8; font-size: 48px; font-weight: 700;">${credits}</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your new credits are now available in your account. Happy creating!
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}" style="${buttonStyle}">
              Use Your Credits →
            </a>
          </div>
        `,
      };

    case "credit_pack_rejected":
      return {
        subject: `Update on Your Credit Pack Purchase`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">📋</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Credit Pack Update</h1>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We've reviewed your credit pack purchase request. Unfortunately, we were unable to approve your purchase at this time.
          </p>
          
          ${adminNotes ? `
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 600;">📝 Reason:</p>
            <p style="margin: 0; color: #92400e; line-height: 1.6;">${adminNotes}</p>
          </div>
          ` : ''}
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you have questions or believe this was an error, please contact our support team.
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="mailto:${brand.supportEmail}" style="${buttonStyle}">
              Contact Support
            </a>
          </div>
        `,
      };

    case "referral_reward":
      return {
        subject: `You Earned ${credits} Bonus Credits! 🎁`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">🎁</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Referral Reward!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">Someone used your referral code</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Great news! Someone you referred has signed up and you've earned bonus credits as a thank you!
          </p>
          
          <div style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 32px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #059669; font-size: 14px; font-weight: 500;">Bonus Credits Earned</p>
            <p style="margin: 0; color: #047857; font-size: 48px; font-weight: 700;">+${credits}</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Keep sharing your referral link to earn more rewards!
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}/referrals" style="${buttonStyle}">
              View Your Referrals →
            </a>
          </div>
        `,
      };

    case "subscription_expiring":
      return {
        subject: `Your Subscription Expires in ${expiresIn} Days ⏰`,
        content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 64px;">⏰</span>
            <h1 style="margin: 16px 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Subscription Expiring Soon</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">Don't lose your benefits</p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Your <strong>${planName}</strong> subscription will expire in <strong>${expiresIn} days</strong>.
          </p>
          
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #b91c1c; line-height: 1.6;">
              ⚠️ To continue enjoying unlimited access to all features, please renew your subscription before it expires.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}/subscription" style="${buttonStyle}">
              Renew Subscription →
            </a>
          </div>
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
    
    if (!payload.userEmail) {
      return new Response(
        JSON.stringify({ error: "User email is required" }),
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

    // Get system settings for branding
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get brand settings
    const brand = await getBrandSettings(supabaseAdmin);

    // Get email content
    const { subject, content } = getEmailContent(payload, brand);

    // Wrap content in branded template
    const html = getEmailWrapper(content, brand);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${brand.siteName} <onboarding@resend.dev>`,
      to: [payload.userEmail],
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
