import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Check, Image, Zap, Wand2, FileCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { usePricing } from "@/hooks/use-pricing";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { useThemeLogo } from "@/hooks/use-theme-logo";

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
  const [isSignUp, setIsSignUp] = useState(false);
  
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Logo
  const { logo } = useThemeLogo();

  // Handle auth tokens from URL hash (password reset or email confirmation)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");
      
      const isRecovery = type === "recovery";
      const isSignupCallback = type === "signup" || type === "email";
      
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
      
      if (accessToken && refreshToken && (isRecovery || isSignupCallback)) {
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
          } else if (isSignupCallback) {
            toast.success("Email confirmed! Welcome aboard.");
          }
          
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

    if (window.location.hash || isResetMode || isConfirmMode) {
      handleAuthCallback();
    }
  }, [isResetMode, isConfirmMode]);

  // Redirect if already authenticated (but not in reset mode)
  useEffect(() => {
    if (user && !isResetMode) {
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render special states (processing, errors, reset mode, forgot password, resend confirmation)
  const renderSpecialContent = () => {
    if (isProcessingAuth) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Processing...</p>
        </div>
      );
    }
    
    if (authError) {
      return (
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
      );
    }
    
    if (isResetMode && user) {
      return <ResetPasswordForm />;
    }
    
    if (isResetMode && !user) {
      return (
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
      );
    }
    
    if (showForgotPassword) {
      return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
    }
    
    if (showResendConfirmation) {
      return <ResendConfirmationForm onBack={() => setShowResendConfirmation(false)} />;
    }
    
    return null;
  };

  const specialContent = renderSpecialContent();

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group mb-12">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-auto"
            />
          </a>

          {/* Special content or main auth forms */}
          {specialContent ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {authError ? "Something went wrong" : isResetMode ? "Reset Password" : showForgotPassword ? "Forgot Password" : "Confirm Email"}
                </h1>
              </div>
              {specialContent}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {isSignUp ? "Start generating AI-powered metadata today" : "Please enter your details"}
                </p>
                {selectedPlan && selectedPlanKey !== "free" && (
                  <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">Selected plan:</span>
                      <Badge variant="secondary" className="font-medium">
                        {selectedPlan.displayName} - ${selectedPlan.price}{selectedPlan.period}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be directed to complete your subscription after signing up
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-6">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Auth Forms */}
              {isSignUp ? (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
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
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(false); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember for 30 days
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(true); setError(null); }}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
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
              )}
            </>
          )}

          {/* Back to home */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            <a href="/" className="hover:text-foreground transition-colors">
              ← Back to home
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-secondary/20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="absolute top-20 left-10 w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <svg className="absolute top-32 right-20 w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <svg className="absolute top-48 left-1/4 w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <svg className="absolute bottom-40 right-10 w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <svg className="absolute bottom-60 left-16 w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {/* Decorative circles */}
          <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-secondary/40" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-secondary/30" />
          <div className="absolute bottom-1/4 left-1/4 w-4 h-4 rounded-full bg-secondary/30" />
          <div className="absolute top-2/3 right-1/5 w-2 h-2 rounded-full bg-secondary/40" />
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-lg text-center px-8">
          {/* Feature icons */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center">
              <Image className="w-8 h-8 text-secondary" />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-background/90 backdrop-blur-sm shadow-xl flex items-center justify-center">
              <Wand2 className="w-10 h-10 text-secondary" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-secondary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">
            AI-Powered Metadata Generation
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your images and let AI generate optimized titles, descriptions, and keywords for stock marketplaces in seconds.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/80 mx-auto mb-2">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm font-medium text-foreground">Fast</p>
              <p className="text-xs text-muted-foreground">Seconds per image</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/80 mx-auto mb-2">
                <Check className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm font-medium text-foreground">Accurate</p>
              <p className="text-xs text-muted-foreground">AI-optimized</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/80 mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm font-medium text-foreground">Smart</p>
              <p className="text-xs text-muted-foreground">SEO ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
