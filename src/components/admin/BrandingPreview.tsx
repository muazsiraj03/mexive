import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useThemeLogo } from "@/hooks/use-theme-logo";
import { 
  Eye,
  Globe,
  X,
  Sun,
  Moon
} from "lucide-react";
import logoIconFallback from "@/assets/logo-icon.png";

export function BrandingPreview() {
  const { settings } = useSystemSettings();
  const { logo } = useThemeLogo();

  const faviconSrc = settings.faviconUrl || logoIconFallback;
  const lightLogo = settings.logoLightMode || logoIconFallback;
  const darkLogo = settings.logoDarkMode || logoIconFallback;

  const sizeClasses = {
    small: "h-6 w-auto",
    medium: "h-8 w-auto",
    large: "h-10 w-auto",
  };

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
        <CardDescription>
          See how your branding will appear across the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Tab Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Browser Tab</p>
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center gap-2 ml-2">
                {/* Tab */}
                <div className="flex items-center gap-2 bg-background rounded-t-lg px-3 py-1.5 border border-b-0 max-w-[200px]">
                  <img 
                    src={faviconSrc} 
                    alt="Favicon" 
                    className="w-4 h-4 object-contain rounded-sm"
                  />
                  <span className="text-xs truncate text-foreground">
                    {settings.browserTitle || "MetaGen"}
                  </span>
                  <X className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                </div>
              </div>
            </div>
            {/* Address bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-background border-b">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Globe className="h-4 w-4" />
              </div>
              <div className="flex-1 bg-muted rounded-full px-3 py-1 text-xs text-muted-foreground">
                https://metagen.lovable.app
              </div>
            </div>
            {/* Page content placeholder */}
            <div className="h-16 bg-background" />
          </div>
        </div>

        {/* Header Preview - Light Mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-muted-foreground">Header (Light Mode)</p>
          </div>
          <div className="rounded-lg border overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className={`flex items-center flex-1 ${alignmentClasses[settings.logoAlignment]}`}>
                <img 
                  src={lightLogo} 
                  alt="Logo" 
                  className={`${sizeClasses[settings.logoSize]} object-contain`}
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <span className="hidden sm:inline">Features</span>
                <span className="hidden sm:inline">Pricing</span>
                <span className="hidden sm:inline">FAQ</span>
                <div className="h-8 px-4 bg-zinc-900 text-white rounded-full flex items-center text-xs font-medium">
                  Get Started
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Preview - Dark Mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" />
            <p className="text-sm font-medium text-muted-foreground">Header (Dark Mode)</p>
          </div>
          <div className="rounded-lg border overflow-hidden bg-zinc-950">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className={`flex items-center flex-1 ${alignmentClasses[settings.logoAlignment]}`}>
                <img 
                  src={darkLogo} 
                  alt="Logo" 
                  className={`${sizeClasses[settings.logoSize]} object-contain`}
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="hidden sm:inline">Features</span>
                <span className="hidden sm:inline">Pricing</span>
                <span className="hidden sm:inline">FAQ</span>
                <div className="h-8 px-4 bg-zinc-100 text-zinc-900 rounded-full flex items-center text-xs font-medium">
                  Get Started
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Footer</p>
          <div className="rounded-lg border overflow-hidden bg-background">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
              <div className="flex items-center">
                <img 
                  src={logo} 
                  alt="Logo" 
                  className={`${sizeClasses[settings.logoSize]} object-contain`}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {settings.footerText || "© 2025 MetaGen. All rights reserved."}
              </p>
            </div>
          </div>
        </div>

        {/* Social Share Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Social Share Preview</p>
          <div className="rounded-lg border overflow-hidden bg-muted/30 max-w-md">
            {/* Social card */}
            <div className="bg-background">
              {settings.ogImageUrl ? (
                <img 
                  src={settings.ogImageUrl} 
                  alt="OG Image" 
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="w-10 h-10 rounded-lg object-contain"
                    />
                    <span className="font-semibold text-lg">{settings.appName || "MetaGen"}</span>
                  </div>
                </div>
              )}
              <div className="p-3 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  metagen.lovable.app
                </p>
                <p className="font-medium text-foreground text-sm line-clamp-1">
                  {settings.browserTitle || "MetaGen - AI Metadata Generator"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {settings.metaDescription || "Generate optimized metadata for your stock images and videos with AI"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Search Engine Result</p>
          <div className="rounded-lg border bg-background p-4 max-w-lg">
            <div className="flex items-center gap-2 mb-1">
              <img 
                src={faviconSrc} 
                alt="Favicon" 
                className="w-4 h-4 object-contain rounded-sm"
              />
              <span className="text-xs text-muted-foreground">metagen.lovable.app</span>
            </div>
            <a href="#" className="text-lg text-blue-600 hover:underline font-medium line-clamp-1">
              {settings.browserTitle || "MetaGen - AI Metadata Generator"}
            </a>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {settings.metaDescription || "Generate optimized metadata for your stock images and videos with AI"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
