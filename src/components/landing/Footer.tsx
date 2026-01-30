import { useSystemSettings } from "@/hooks/use-system-settings";
import { useThemeLogo } from "@/hooks/use-theme-logo";

export function Footer() {
  const { settings } = useSystemSettings();
  const { logo } = useThemeLogo();

  const sizeClasses = {
    small: "h-6",
    medium: "h-8",
    large: "h-10",
  };

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="/" className="flex items-center">
            <img 
              src={logo} 
              alt={settings.appName} 
              className={`${sizeClasses[settings.logoSize]} w-auto object-contain hover:opacity-80 transition-opacity`}
            />
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Terms of Service
            </a>
            <a href={`mailto:${settings.supportEmail}`} className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Contact
            </a>
            <a href={`mailto:${settings.supportEmail}`} className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Support
            </a>
          </nav>

          <p className="text-sm text-muted-foreground">
            {settings.footerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
