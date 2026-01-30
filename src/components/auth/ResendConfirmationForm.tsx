import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

interface ResendConfirmationFormProps {
  onBack: () => void;
  initialEmail?: string;
}

export function ResendConfirmationForm({ onBack, initialEmail = "" }: ResendConfirmationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("Email rate limit exceeded")) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError(error.message);
      }
    } else {
      setIsEmailSent(true);
    }
  };

  if (isEmailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-secondary/20">
          <Mail className="w-6 h-6 text-secondary" />
        </div>
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We've sent a new confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setIsEmailSent(false)}
            className="text-primary hover:underline"
          >
            try again
          </button>
        </p>
        <Button variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-2 mb-4">
        <h3 className="text-lg font-semibold">Resend Confirmation Email</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send a new confirmation link
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confirm-email">Email</Label>
        <Input
          id="confirm-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Confirmation Link"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Button>
    </form>
  );
}
