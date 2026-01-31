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

// Get email template based on type
function getEmailTemplate(payload: EmailPayload, siteName: string, supportEmail: string) {
  const { type, userName, planName, credits, adminNotes, expiresIn } = payload;
  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const dashboardUrl = payload.dashboardUrl || "https://mexive.lovable.app/dashboard";
  
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { color: #6366f1; margin: 0; font-size: 28px; }
      .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
      .highlight { background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; }
      .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .button:hover { background: #4f46e5; }
      .footer { text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
      .emoji { font-size: 48px; margin-bottom: 20px; }
    </style>
  `;

  switch (type) {
    case "welcome":
      return {
        subject: `Welcome to ${siteName}! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">🎉</div>
                <h1>Welcome to ${siteName}!</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>Thank you for joining ${siteName}! We're excited to have you on board.</p>
                <p>Your account is now ready. Here's what you can do:</p>
                <ul>
                  <li>🖼️ <strong>Generate Metadata</strong> - Upload your images and get AI-powered titles, descriptions, and keywords</li>
                  <li>✨ <strong>Image to Prompt</strong> - Convert any image into detailed AI prompts</li>
                  <li>📋 <strong>File Reviewer</strong> - Check your files for marketplace compliance</li>
                </ul>
                ${credits ? `<p>You've been given <span class="highlight">${credits} free credits</span> to get started!</p>` : ''}
                <center>
                  <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                </center>
              </div>
              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "upgrade_approved":
      return {
        subject: `Your ${planName} Plan is Now Active! 🚀`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">🚀</div>
                <h1>Upgrade Approved!</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>Great news! Your upgrade to the <strong>${planName}</strong> plan has been approved.</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Plan:</strong> ${planName}</p>
                  ${credits ? `<p style="margin: 10px 0 0 0;"><strong>Credits:</strong> ${credits}</p>` : '<p style="margin: 10px 0 0 0;"><strong>Credits:</strong> Unlimited</p>'}
                </div>
                <p>Your new credits are ready to use. Start generating amazing metadata for your content!</p>
                <center>
                  <a href="${dashboardUrl}" class="button">Start Using Your Credits</a>
                </center>
              </div>
              <div class="footer">
                <p>Thank you for your support!</p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "upgrade_rejected":
      return {
        subject: `Update on Your Upgrade Request - ${siteName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Upgrade Request Update</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>We've reviewed your upgrade request for the <strong>${planName}</strong> plan.</p>
                <p>Unfortunately, we were unable to approve your request at this time.</p>
                ${adminNotes ? `
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; font-weight: 600;">Reason:</p>
                  <p style="margin: 10px 0 0 0;">${adminNotes}</p>
                </div>
                ` : ''}
                <p>If you believe this was a mistake or need assistance, please don't hesitate to contact our support team.</p>
                <center>
                  <a href="mailto:${supportEmail}" class="button">Contact Support</a>
                </center>
              </div>
              <div class="footer">
                <p>We're here to help!</p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "credit_pack_approved":
      return {
        subject: `Your Credits Have Been Added! 💳`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">💳</div>
                <h1>Credits Added!</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>Your credit pack purchase has been approved and your account has been credited!</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Credits Added</p>
                  <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #6366f1;">${credits}</p>
                </div>
                <p>Your new credits are now available in your account. Happy creating!</p>
                <center>
                  <a href="${dashboardUrl}" class="button">Use Your Credits</a>
                </center>
              </div>
              <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "credit_pack_rejected":
      return {
        subject: `Update on Your Credit Pack Purchase - ${siteName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Credit Pack Update</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>We've reviewed your credit pack purchase request.</p>
                <p>Unfortunately, we were unable to approve your purchase at this time.</p>
                ${adminNotes ? `
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; font-weight: 600;">Reason:</p>
                  <p style="margin: 10px 0 0 0;">${adminNotes}</p>
                </div>
                ` : ''}
                <p>If you have questions or believe this was an error, please contact our support team.</p>
                <center>
                  <a href="mailto:${supportEmail}" class="button">Contact Support</a>
                </center>
              </div>
              <div class="footer">
                <p>We're here to help!</p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "referral_reward":
      return {
        subject: `You Earned ${credits} Bonus Credits! 🎁`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">🎁</div>
                <h1>Referral Reward!</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>Great news! Someone you referred has signed up and you've earned bonus credits!</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Bonus Credits Earned</p>
                  <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #22c55e;">+${credits}</p>
                </div>
                <p>Keep sharing your referral link to earn more rewards!</p>
                <center>
                  <a href="${dashboardUrl}/referrals" class="button">View Your Referrals</a>
                </center>
              </div>
              <div class="footer">
                <p>Thank you for spreading the word!</p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "subscription_expiring":
      return {
        subject: `Your ${siteName} Subscription Expires Soon ⏰`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">⏰</div>
                <h1>Subscription Expiring</h1>
              </div>
              <div class="content">
                <p>${greeting}</p>
                <p>Your <strong>${planName}</strong> subscription will expire in <strong>${expiresIn} days</strong>.</p>
                <p>To continue enjoying unlimited access to all features, please renew your subscription before it expires.</p>
                <center>
                  <a href="${dashboardUrl}/subscription" class="button">Renew Subscription</a>
                </center>
              </div>
              <div class="footer">
                <p>Questions? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
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

    // Fetch site name and support email
    const { data: settings } = await supabaseAdmin
      .from("system_settings")
      .select("key, value")
      .in("key", ["app_name", "support_email"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });

    const siteName = settingsMap.app_name || "Mexive";
    const supportEmail = settingsMap.support_email || "support@mexive.com";

    // Get email template
    const { subject, html } = getEmailTemplate(payload, siteName, supportEmail);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${siteName} <onboarding@resend.dev>`,
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
