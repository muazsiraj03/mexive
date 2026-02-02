import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

function normalizeHookSecret(secret: string): string {
  // Supabase UI examples often look like: "v1,whsec_<base64url>".
  // standardwebhooks expects raw base64 (not base64url) secret material.
  let s = (secret || "").trim();
  if (!s) return s;

  // Remove version prefix
  if (s.includes(",")) {
    s = s.split(",").pop()!.trim();
  }

  // Remove whsec_ prefix
  if (s.startsWith("whsec_")) {
    s = s.slice("whsec_".length);
  }

  // Convert base64url -> base64
  s = s.replace(/-/g, "+").replace(/_/g, "/");

  // Pad to multiple of 4
  const pad = s.length % 4;
  if (pad) s = s + "=".repeat(4 - pad);
  return s;
}

const hookSecret = normalizeHookSecret(hookSecretRaw);

interface BrandSettings {
  siteName: string;
  supportEmail: string;
  primaryColor: string;
  websiteUrl: string;
}

// Get brand settings from system_settings
async function getBrandSettings(): Promise<BrandSettings> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: settings } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["app_name", "support_email", "website_url"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value || "";
  });

  return {
    siteName: settingsMap.app_name || "Mexive",
    supportEmail: settingsMap.support_email || "support@mexive.com",
    primaryColor: "#6366f1",
    websiteUrl: settingsMap.website_url || "https://mexive.lovable.app",
  };
}

// Generate the branded email wrapper - matches send-user-email style
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
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                          If you have additional questions, please refer to the 
                          <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;">Support Service</a>.
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td align="center" style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                          Please do not reply to this email. This mailbox is not monitored.
                          <br>For assistance, please write to: 
                          <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none;">${brand.supportEmail}</a>
                        </p>
                      </td>
                    </tr>
                    
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

// Get icon for email type
function getIconCircle(icon: string, brand: BrandSettings): string {
  const iconMap: Record<string, string> = {
    recovery: "🔐",
    signup: "🎉",
    magiclink: "✨",
    email_change: "📧",
    invite: "💌",
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

// Generate email content based on type
function getEmailContent(
  emailType: string,
  verifyUrl: string,
  token: string,
  brand: BrandSettings
) {
  const buttonStyle = `display: inline-block; background-color: ${brand.primaryColor}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;`;
  const linkStyle = `color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;`;
  const textStyle = `color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;`;
  const signatureStyle = `color: #374151; font-size: 15px; margin-top: 32px;`;

  switch (emailType) {
    case "recovery":
      return {
        subject: `Reset Your Password - ${brand.siteName}`,
        content: `
          ${getIconCircle("recovery", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Reset Your Password
          </h1>
          
          <p style="${textStyle}">
            <strong>Hello,</strong>
          </p>
          
          <p style="${textStyle}">
            We received a request to reset your password for your account at 
            <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.siteName}</a>.
          </p>
          
          <p style="${textStyle}">
            Click the button below to create a new password. This link will expire in 1 hour.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Reset Password
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? <a href="${verifyUrl}" style="${linkStyle}">Click here</a>
          </p>
          
          <p style="${textStyle}">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "signup":
      return {
        subject: `Confirm Your Email - ${brand.siteName}`,
        content: `
          ${getIconCircle("signup", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Confirm Your Email
          </h1>
          
          <p style="${textStyle}">
            <strong>Hello,</strong>
          </p>
          
          <p style="${textStyle}">
            Thank you for signing up at <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.siteName}</a>!
          </p>
          
          <p style="${textStyle}">
            Please confirm your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Confirm Email
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? <a href="${verifyUrl}" style="${linkStyle}">Click here</a>
          </p>
          
          <p style="${textStyle}">
            If you didn't create an account, you can safely ignore this email.
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "magiclink":
      return {
        subject: `Your Login Link - ${brand.siteName}`,
        content: `
          ${getIconCircle("magiclink", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Your Magic Login Link
          </h1>
          
          <p style="${textStyle}">
            <strong>Hello,</strong>
          </p>
          
          <p style="${textStyle}">
            Click the button below to log in to your <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.siteName}</a> account:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Log In
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? <a href="${verifyUrl}" style="${linkStyle}">Click here</a>
          </p>
          
          ${token ? `
          <div style="text-align: center; background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Or use this one-time code:</p>
            <code style="font-size: 24px; font-weight: 700; color: #1f2937; letter-spacing: 2px;">${token}</code>
          </div>
          ` : ''}
          
          <p style="${textStyle}">
            If you didn't request this link, you can safely ignore this email.
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "email_change":
      return {
        subject: `Confirm Email Change - ${brand.siteName}`,
        content: `
          ${getIconCircle("email_change", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Confirm Your New Email
          </h1>
          
          <p style="${textStyle}">
            <strong>Hello,</strong>
          </p>
          
          <p style="${textStyle}">
            You requested to change the email address associated with your 
            <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.siteName}</a> account.
          </p>
          
          <p style="${textStyle}">
            Please confirm your new email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Confirm New Email
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? <a href="${verifyUrl}" style="${linkStyle}">Click here</a>
          </p>
          
          <p style="${textStyle}">
            If you didn't request this change, please contact support immediately.
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    case "invite":
      return {
        subject: `You've Been Invited to ${brand.siteName}`,
        content: `
          ${getIconCircle("invite", brand)}
          
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            You're Invited!
          </h1>
          
          <p style="${textStyle}">
            <strong>Hello,</strong>
          </p>
          
          <p style="${textStyle}">
            You've been invited to join <a href="${brand.websiteUrl}" style="${linkStyle}">${brand.siteName}</a>!
          </p>
          
          <p style="${textStyle}">
            Click the button below to accept your invitation and set up your account:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Accept Invitation
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px;">
            Can't see the button? <a href="${verifyUrl}" style="${linkStyle}">Click here</a>
          </p>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };

    default:
      return {
        subject: `Action Required - ${brand.siteName}`,
        content: `
          <h1 style="text-align: center; margin: 0 0 32px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Action Required
          </h1>
          
          <p style="${textStyle}">
            Click the button below to continue:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="${buttonStyle}">
              Continue
            </a>
          </div>
          
          <p style="${signatureStyle}">
            Yours sincerely,<br>
            <strong>${brand.siteName} Team</strong>
          </p>
        `,
      };
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature
    if (!hookSecret) {
      return new Response(
        JSON.stringify({
          error: {
            http_code: 500,
            message:
              "SEND_EMAIL_HOOK_SECRET is missing/empty in Edge Function secrets",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log(`Processing ${email_action_type} email for ${user.email}`);

    // Get brand settings
    const brand = await getBrandSettings();

    // Build verification URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Get email content
    const { subject, content } = getEmailContent(email_action_type, verifyUrl, token, brand);

    // Wrap content in branded template
    const html = getEmailWrapper(content, brand);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: `${brand.siteName} <onboarding@resend.dev>`,
      to: [user.email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Failed to send auth email:", emailError);
      return new Response(
        JSON.stringify({
          error: { http_code: 500, message: emailError.message },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Auth email sent: ${email_action_type} to ${user.email}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({
        error: { http_code: error.code || 500, message: error.message },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
});
