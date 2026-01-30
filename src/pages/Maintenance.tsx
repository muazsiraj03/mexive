import { Wrench, Clock } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoIcon} alt="Logo" className="h-16 w-16" />
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-secondary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            We'll Be Right Back
          </h1>
          <p className="text-muted-foreground text-lg">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-muted/50 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Maintenance in progress</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This usually takes just a few minutes. Please check back soon.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Thank you for your patience!
        </p>
      </div>
    </div>
  );
}
