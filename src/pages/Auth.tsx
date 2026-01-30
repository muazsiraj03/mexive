import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { usePricing } from "@/hooks/use-pricing";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

interface LocationState {
  from?: Location;
  selectedPlan?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { getPlanByName } = usePricing();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorType, setAuthErrorType] = useState<"reset" | "confirmation" | null>(null);
  
  // Check if this is a password reset flow or confirmation flow
  const isResetMode = searchParams.get("mode") === "reset";
  const isConfirmMode = searchParams.get("mode") === "confirm";
  
  // Get selected plan from navigation state
  const locationState = location.state as LocationState | null;
  const selectedPlanKey = locationState?.selectedPlan;
  const selectedPlan = selectedPlanKey ? getPlanByName(selectedPlanKey) : null;
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  // Handle auth tokens from URL hash (password reset or email confirmation)
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for tokens in URL hash (Supabase sends them as hash fragments)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");
      
      // Determine the type of callback
      const isRecovery = type === "recovery";
      const isSignup = type === "signup" || type === "email";
      
      // Handle error from Supabase (e.g., expired link)
      if (errorCode || errorDescription) {
        const decodedError = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : null;
        
        if (isResetMode || type === "recovery") {
          setAuthError(decodedError || "The password reset link is invalid or has expired. Please request a new one.");
          setAuthErrorType("reset");
          window.history.replaceState(null, "", window.location.pathname + "?mode=reset");
        } else {
          setAuthError(decodedError || "The confirmation link is invalid or has expired. Please request a new one.");
          setAuthErrorType("confirmation");
          window.history.replaceState(null, "", window.location.pathname + "?mode=confirm");
        }
        return;
      }
      
      // If we have tokens, set the session
      if (accessToken && refreshToken && (isRecovery || isSignup)) {
        setIsProcessingAuth(true);
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            if (isRecovery) {
              setAuthError(error.message);
              setAuthErrorType("reset");
            } else {
              setAuthError(error.message);
              setAuthErrorType("confirmation");
            }
          } else if (isSignup) {
            // Email confirmed successfully
            toast.success("Email confirmed! Welcome to StockMeta AI.");
          }
          
          // Clean up URL hash after processing
          const mode = isRecovery ? "?mode=reset" : "";
          window.history.replaceState(null, "", window.location.pathname + mode);
        } catch (err) {
          if (isRecovery) {
            setAuthError("Failed to process reset link. Please try again.");
            setAuthErrorType("reset");
          } else {
            setAuthError("Failed to confirm email. Please try again.");
            setAuthErrorType("confirmation");
          }
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };

    // Run on mount and when mode changes
    if (window.location.hash || isResetMode || isConfirmMode) {
      handleAuthCallback();
    }
  }, [isResetMode, isConfirmMode]);

  // Redirect if already authenticated (but not in reset mode)
  useEffect(() => {
    if (user && !isResetMode) {
      // If user just signed up with a selected plan, go to subscription page
      if (selectedPlanKey && selectedPlanKey !== "free") {
        navigate("/dashboard/subscription", { 
          replace: true,
          state: { selectedPlan: selectedPlanKey }
        });
      } else {
        const from = locationState?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, locationState, selectedPlanKey, isResetMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate inputs
    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(loginPassword);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(error.message);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate inputs
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName || undefined);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("An account with this email already exists. Please log in instead.");
      } else {
        setError(error.message);
      }
    } else {
      toast.success("Account created! Check your email to confirm your account.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-sm group-hover:shadow-md transition-all duration-200">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="font-semibold text-xl text-foreground">StockMeta AI</span>
          </a>
          <p className="text-muted-foreground text-center">
            AI-powered metadata for stock photos
          </p>
          {selectedPlan && selectedPlanKey !== "free" && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Check className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Selected plan:</span>
                <Badge variant="secondary" className="font-medium">
                  {selectedPlan.displayName} - ${selectedPlan.price}{selectedPlan.period}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                You'll be directed to complete your subscription after signing up
              </p>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
          {/* Processing Auth Callback */}
          {isProcessingAuth ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Processing...</p>
            </div>
          ) : authError ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {authError}
              </div>
              {authErrorType === "reset" ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setAuthError(null);
                    setAuthErrorType(null);
                    setShowForgotPassword(true);
                    navigate("/auth", { replace: true });
                  }}
                >
                  Request New Reset Link
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setAuthError(null);
                    setAuthErrorType(null);
                    setShowResendConfirmation(true);
                    navigate("/auth", { replace: true });
                  }}
                >
                  Resend Confirmation Email
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setAuthError(null);
                  setAuthErrorType(null);
                  navigate("/auth", { replace: true });
                }}
              >
                Back to Login
              </Button>
            </div>
          ) : isResetMode && user ? (
            <ResetPasswordForm />
          ) : isResetMode && !user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                The password reset link is invalid or has expired. Please request a new one.
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowForgotPassword(true);
                  navigate("/auth", { replace: true });
                }}
              >
                Request New Reset Link
              </Button>
            </div>
          ) : showForgotPassword ? (
            <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
          ) : showResendConfirmation ? (
            <ResendConfirmationForm onBack={() => setShowResendConfirmation(false)} />
          ) : (
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Didn't receive confirmation email?{" "}
                  <button
                    type="button"
                    onClick={() => setShowResendConfirmation(true)}
                    className="text-primary hover:underline"
                  >
                    Resend it
                  </button>
                </p>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">
            ← Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
