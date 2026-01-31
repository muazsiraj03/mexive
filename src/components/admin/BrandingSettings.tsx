import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings, LogoSize, LogoAlignment } from "@/hooks/use-system-settings";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  Trash2, 
  Loader2, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Globe,
  FileImage,
  Type,
  Mail,
  Phone,
  Clock,
  Search,
  Share2,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { BrandingPreview } from "./BrandingPreview";

// ==================== Logo Upload Card ====================
interface LogoUploadCardProps {
  mode: "light" | "dark";
  currentLogo: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  uploading: boolean;
  removing: boolean;
}

function LogoUploadCard({ 
  mode, 
  currentLogo, 
  onUploadComplete, 
  onRemove,
  uploading,
  removing
}: LogoUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPEG, SVG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const fileName = `logo-${mode}-${Date.now()}.${file.name.split('.').pop()}`;
    
    try {
      const { data, error } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("branding")
        .getPublicUrl(data.path);

      onUploadComplete(publicUrl.publicUrl);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isLight = mode === "light";
  const Icon = isLight ? Sun : Moon;

  return (
    <div className={cn(
      "relative rounded-xl border-2 border-dashed p-6 transition-all hover:border-primary/50",
      isLight ? "bg-card" : "bg-background border-border"
    )}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("h-5 w-5", isLight ? "text-amber-500" : "text-indigo-400")} />
        <Label className="font-medium text-foreground">
          {isLight ? "Light Mode Logo" : "Dark Mode Logo"}
        </Label>
      </div>

      {currentLogo ? (
        <div className="space-y-4">
          <div className={cn(
            "flex items-center justify-center rounded-lg p-4 min-h-[100px]",
            isLight ? "bg-muted" : "bg-muted/50"
          )}>
            <img 
              src={currentLogo} 
              alt={`${mode} mode logo`}
              className="max-h-16 max-w-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={removing}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center rounded-lg p-6 min-h-[100px] transition-colors bg-muted hover:bg-muted/80 text-muted-foreground"
        >
          {uploading ? <Loader2 className="h-8 w-8 animate-spin mb-2" /> : <ImageIcon className="h-8 w-8 mb-2" />}
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</span>
        </button>
      )}
    </div>
  );
}

// ==================== Favicon Upload Card ====================
interface FaviconUploadCardProps {
  currentFavicon: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  uploading: boolean;
  removing: boolean;
}

function FaviconUploadCard({ 
  currentFavicon, 
  onUploadComplete, 
  onRemove,
  uploading,
  removing
}: FaviconUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];
    const validExtensions = [".png", ".ico", ".svg"];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, ICO, or SVG file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Favicon must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    const fileName = `favicon-${Date.now()}.${file.name.split('.').pop()}`;
    
    try {
      const { data, error } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("branding")
        .getPublicUrl(data.path);

      onUploadComplete(publicUrl.publicUrl);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload favicon",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative rounded-xl border-2 border-dashed p-6 transition-all hover:border-primary/50 bg-card">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.ico,.svg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <Label className="font-medium text-foreground">Favicon</Label>
      </div>

      {currentFavicon ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-lg p-4 min-h-[80px] bg-muted">
            <img 
              src={currentFavicon} 
              alt="Favicon"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={removing}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center rounded-lg p-4 min-h-[80px] transition-colors bg-muted hover:bg-muted/80 text-muted-foreground"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin mb-2" /> : <Globe className="h-6 w-6 mb-2" />}
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload favicon"}</span>
          <span className="text-xs mt-1 opacity-70">PNG, ICO, or SVG</span>
        </button>
      )}
    </div>
  );
}

// ==================== Main Branding Settings ====================
export function BrandingSettings() {
  const { settings, updateSetting } = useSystemSettings();
  const { toast } = useToast();
  
  // Upload states
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [removingLight, setRemovingLight] = useState(false);
  const [removingDark, setRemovingDark] = useState(false);
  const [removingFavicon, setRemovingFavicon] = useState(false);
  const [removingOgImage, setRemovingOgImage] = useState(false);
  
  // Form states
  const [appName, setAppName] = useState(settings.appName);
  const [browserTitle, setBrowserTitle] = useState(settings.browserTitle);
  const [footerText, setFooterText] = useState(settings.footerText);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [responseTime, setResponseTime] = useState(settings.responseTime);
  const [adminNotificationEmail, setAdminNotificationEmail] = useState(settings.adminNotificationEmail);
  const [websiteUrl, setWebsiteUrl] = useState(settings.websiteUrl);
  const [metaDescription, setMetaDescription] = useState(settings.metaDescription);
  const [metaKeywords, setMetaKeywords] = useState(settings.metaKeywords);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);

  // Sync form with settings when they load
  useState(() => {
    setAppName(settings.appName);
    setBrowserTitle(settings.browserTitle);
    setFooterText(settings.footerText);
    setSupportEmail(settings.supportEmail);
    setWhatsappNumber(settings.whatsappNumber);
    setResponseTime(settings.responseTime);
    setAdminNotificationEmail(settings.adminNotificationEmail);
    setWebsiteUrl(settings.websiteUrl);
    setMetaDescription(settings.metaDescription);
    setMetaKeywords(settings.metaKeywords);
  });

  const handleUploadComplete = async (type: "light" | "dark" | "favicon" | "og", url: string) => {
    const setUploading = {
      light: setUploadingLight,
      dark: setUploadingDark,
      favicon: setUploadingFavicon,
      og: setUploadingOgImage,
    }[type];
    
    const settingKey = {
      light: "logo_light_mode",
      dark: "logo_dark_mode",
      favicon: "favicon_url",
      og: "og_image_url",
    }[type];
    
    const label = {
      light: "Light mode logo",
      dark: "Dark mode logo",
      favicon: "Favicon",
      og: "OG image",
    }[type];
    
    setUploading(true);
    const success = await updateSetting(settingKey, url);
    setUploading(false);

    toast({
      title: success ? "Uploaded successfully" : "Failed to save",
      description: success ? `${label} has been updated` : "Please try again",
      variant: success ? "default" : "destructive",
    });
  };

  const handleRemove = async (type: "light" | "dark" | "favicon" | "og") => {
    const setRemoving = {
      light: setRemovingLight,
      dark: setRemovingDark,
      favicon: setRemovingFavicon,
      og: setRemovingOgImage,
    }[type];
    
    const settingKey = {
      light: "logo_light_mode",
      dark: "logo_dark_mode",
      favicon: "favicon_url",
      og: "og_image_url",
    }[type];
    
    const currentUrl = {
      light: settings.logoLightMode,
      dark: settings.logoDarkMode,
      favicon: settings.faviconUrl,
      og: settings.ogImageUrl,
    }[type];

    setRemoving(true);

    try {
      if (currentUrl) {
        const fileName = currentUrl.split("/").pop();
        if (fileName) {
          await supabase.storage.from("branding").remove([fileName]);
        }
      }

      const success = await updateSetting(settingKey, "");
      
      if (success) {
        toast({ title: "Removed successfully" });
      }
    } catch (error: any) {
      toast({
        title: "Failed to remove",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleSaveIdentity = async () => {
    setSavingIdentity(true);
    try {
      await Promise.all([
        updateSetting("app_name", appName),
        updateSetting("browser_title", browserTitle),
        updateSetting("footer_text", footerText),
        updateSetting("support_email", supportEmail),
        updateSetting("whatsapp_number", whatsappNumber),
        updateSetting("response_time", responseTime),
        updateSetting("admin_notification_email", adminNotificationEmail),
        updateSetting("website_url", websiteUrl),
      ]);
      toast({ title: "Brand identity saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true);
    try {
      await Promise.all([
        updateSetting("meta_description", metaDescription),
        updateSetting("meta_keywords", metaKeywords),
      ]);
      toast({ title: "SEO settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingSeo(false);
    }
  };

  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const handleOgImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPEG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "OG image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingOgImage(true);
    const fileName = `og-image-${Date.now()}.${file.name.split('.').pop()}`;
    
    try {
      const { data, error } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("branding")
        .getPublicUrl(data.path);

      await handleUploadComplete("og", publicUrl.publicUrl);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload OG image",
        variant: "destructive",
      });
    } finally {
      setUploadingOgImage(false);
      if (ogImageInputRef.current) {
        ogImageInputRef.current.value = "";
      }
    }
  };

  const handleSizeChange = async (size: LogoSize) => {
    const success = await updateSetting("logo_size", size);
    if (success) {
      toast({ title: "Logo size updated" });
    }
  };

  const handleAlignmentChange = async (alignment: LogoAlignment) => {
    const success = await updateSetting("logo_alignment", alignment);
    if (success) {
      toast({ title: "Logo alignment updated" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
            Logo Settings
          </CardTitle>
          <CardDescription>
            Upload different logos for light and dark mode themes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <LogoUploadCard
              mode="light"
              currentLogo={settings.logoLightMode}
              onUploadComplete={(url) => handleUploadComplete("light", url)}
              onRemove={() => handleRemove("light")}
              uploading={uploadingLight}
              removing={removingLight}
            />
            <LogoUploadCard
              mode="dark"
              currentLogo={settings.logoDarkMode}
              onUploadComplete={(url) => handleUploadComplete("dark", url)}
              onRemove={() => handleRemove("dark")}
              uploading={uploadingDark}
              removing={removingDark}
            />
          </div>

          <Separator />

          {/* Logo Size & Alignment Controls */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Logo Size
              </Label>
              <ToggleGroup 
                type="single" 
                value={settings.logoSize} 
                onValueChange={(value) => value && handleSizeChange(value as LogoSize)}
                className="justify-start"
              >
                <ToggleGroupItem value="small" aria-label="Small" className="px-4">
                  <Minimize2 className="h-3 w-3 mr-2" />
                  Small
                </ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium" className="px-4">
                  Medium
                </ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Large" className="px-4">
                  <Maximize2 className="h-3 w-3 mr-2" />
                  Large
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">Controls the logo height in the header and sidebar</p>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <AlignCenter className="h-4 w-4" />
                Logo Alignment
              </Label>
              <ToggleGroup 
                type="single" 
                value={settings.logoAlignment} 
                onValueChange={(value) => value && handleAlignmentChange(value as LogoAlignment)}
                className="justify-start"
              >
                <ToggleGroupItem value="left" aria-label="Left" className="px-4">
                  <AlignLeft className="h-4 w-4 mr-2" />
                  Left
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Center" className="px-4">
                  <AlignCenter className="h-4 w-4 mr-2" />
                  Center
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Right" className="px-4">
                  <AlignRight className="h-4 w-4 mr-2" />
                  Right
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">Controls the logo position in the header</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Favicon
          </CardTitle>
          <CardDescription>
            The icon that appears in browser tabs (recommended: 32x32 or 64x64 pixels)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <FaviconUploadCard
              currentFavicon={settings.faviconUrl}
              onUploadComplete={(url) => handleUploadComplete("favicon", url)}
              onRemove={() => handleRemove("favicon")}
              uploading={uploadingFavicon}
              removing={removingFavicon}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            Brand Identity
          </CardTitle>
          <CardDescription>
            Configure your app name, titles, and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="MetaGen"
              />
              <p className="text-xs text-muted-foreground">Displayed throughout the application</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="browserTitle">Browser Tab Title</Label>
              <Input
                id="browserTitle"
                value={browserTitle}
                onChange={(e) => setBrowserTitle(e.target.value)}
                placeholder="MetaGen - AI Metadata Generator"
              />
              <p className="text-xs text-muted-foreground">Shown in browser tabs</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Support Email
              </Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp Number
              </Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
              />
              <p className="text-xs text-muted-foreground">Shown on contact page</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responseTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Response Time
              </Label>
              <Input
                id="responseTime"
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                placeholder="Usually within 24 hours"
              />
              <p className="text-xs text-muted-foreground">Shown on contact page</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2025 MetaGen. All rights reserved."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminNotificationEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Admin Notification Email
              </Label>
              <Input
                id="adminNotificationEmail"
                type="email"
                value={adminNotificationEmail}
                onChange={(e) => setAdminNotificationEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Receive email notifications for new signups, upgrade requests, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Used in email templates for all links (e.g., Vercel domain)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveIdentity} disabled={savingIdentity}>
              {savingIdentity ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Identity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            SEO & Metadata
          </CardTitle>
          <CardDescription>
            Configure search engine optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="A brief description of your website..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 150-160 characters. Current: {metaDescription.length} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-muted-foreground">Comma-separated keywords for search engines</p>
          </div>

          <Separator />

          {/* OG Image */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social Share Image (OG Image)
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              The image shown when your site is shared on social media. Recommended: 1200x630 pixels
            </p>
            
            <input
              ref={ogImageInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleOgImageSelect}
              className="hidden"
            />
            
            {settings.ogImageUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={settings.ogImageUrl} 
                    alt="OG Image preview"
                    className="w-full max-w-md h-auto object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ogImageInputRef.current?.click()}
                    disabled={uploadingOgImage}
                  >
                    {uploadingOgImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove("og")}
                    disabled={removingOgImage}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {removingOgImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => ogImageInputRef.current?.click()}
                disabled={uploadingOgImage}
                className="w-full max-w-md flex flex-col items-center justify-center rounded-lg p-6 border-2 border-dashed transition-colors bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                {uploadingOgImage ? (
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                ) : (
                  <FileImage className="h-8 w-8 mb-2" />
                )}
                <span className="text-sm font-medium">
                  {uploadingOgImage ? "Uploading..." : "Upload OG Image"}
                </span>
                <span className="text-xs mt-1 opacity-70">PNG, JPEG, or WebP (max 5MB)</span>
              </button>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSeo} disabled={savingSeo}>
              {savingSeo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save SEO Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <BrandingPreview />
    </div>
  );
}
