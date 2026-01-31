import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured");
    }

    // Initialize Supabase client with service role for database insert
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resend = new Resend(resendApiKey);
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields: name, email, subject, and message are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address format");
    }

    // Validate field lengths
    if (name.length > 100) throw new Error("Name must be less than 100 characters");
    if (email.length > 255) throw new Error("Email must be less than 255 characters");
    if (subject.length > 200) throw new Error("Subject must be less than 200 characters");
    if (message.length > 5000) throw new Error("Message must be less than 5000 characters");

    console.log(`Processing contact form from ${name} (${email})`);

    // Save to database first
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name,
        email,
        subject,
        message,
        status: "unread",
      });

    if (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue with email even if DB fails
    } else {
      console.log("Contact submission saved to database");
    }

    // Send email to support
    const emailResponse = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>", // Use your verified domain in production
      to: ["support@mexive.com"], // Replace with your support email
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This email was sent from the contact form on your website.
        </p>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
