import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LogoSize = "small" | "medium" | "large";
export type LogoAlignment = "left" | "center" | "right";

export interface SystemSettings {
  // Platform toggles
  enableCreditPacks: boolean;
  enableNewSignups: boolean;
  maintenanceMode: boolean;
  enableResendConfirmation: boolean;
  // Credit settings
  firstSignupCredits: number;
  dailyRenewableCredits: number;
  // Branding - Logos
  logoLightMode: string;
  logoDarkMode: string;
  faviconUrl: string;
  logoSize: LogoSize;
  logoAlignment: LogoAlignment;
  // Branding - Identity
  appName: string;
  browserTitle: string;
  footerText: string;
  supportEmail: string;
  whatsappNumber: string;
  responseTime: string;
  adminNotificationEmail: string;
  websiteUrl: string;
  // SEO
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
}

const defaultSettings: SystemSettings = {
  enableCreditPacks: true,
  enableNewSignups: true,
  maintenanceMode: false,
  enableResendConfirmation: true,
  firstSignupCredits: 10,
  dailyRenewableCredits: 2,
  logoLightMode: "",
  logoDarkMode: "",
  faviconUrl: "",
  logoSize: "medium",
  logoAlignment: "left",
  appName: "MetaGen",
  browserTitle: "MetaGen - AI Metadata Generator",
  footerText: "© 2025 MetaGen. All rights reserved.",
  supportEmail: "support@metagen.com",
  whatsappNumber: "",
  responseTime: "Usually within 24 hours",
  adminNotificationEmail: "",
  websiteUrl: "",
  metaDescription: "Generate optimized metadata for your stock images and videos with AI",
  metaKeywords: "metadata generator, stock photography, AI, keywords, SEO",
  ogImageUrl: "",
};

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  updateSetting: (key: string, value: boolean | string | number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const parseValue = (val: any): any => {
    if (val === true || val === "true") return true;
    if (val === false || val === "false") return false;
    if (typeof val === "string") {
      // Remove surrounding quotes if present
      return val.replace(/^"|"$/g, "");
    }
    return val;
  };

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching system settings:", error);
        return;
      }

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach((row) => {
          settingsMap[row.key] = parseValue(row.value);
        });

        setSettings({
          enableCreditPacks: settingsMap.enable_credit_packs ?? defaultSettings.enableCreditPacks,
          enableNewSignups: settingsMap.enable_new_signups ?? defaultSettings.enableNewSignups,
          maintenanceMode: settingsMap.maintenance_mode ?? defaultSettings.maintenanceMode,
          enableResendConfirmation: settingsMap.enable_resend_confirmation ?? defaultSettings.enableResendConfirmation,
          firstSignupCredits: parseInt(settingsMap.first_signup_credits) || defaultSettings.firstSignupCredits,
          dailyRenewableCredits: parseInt(settingsMap.daily_renewable_credits) || defaultSettings.dailyRenewableCredits,
          logoLightMode: settingsMap.logo_light_mode || "",
          logoDarkMode: settingsMap.logo_dark_mode || "",
          faviconUrl: settingsMap.favicon_url || "",
          logoSize: (settingsMap.logo_size as LogoSize) || defaultSettings.logoSize,
          logoAlignment: (settingsMap.logo_alignment as LogoAlignment) || defaultSettings.logoAlignment,
          appName: settingsMap.app_name || defaultSettings.appName,
          browserTitle: settingsMap.browser_title || defaultSettings.browserTitle,
          footerText: settingsMap.footer_text || defaultSettings.footerText,
          supportEmail: settingsMap.support_email || defaultSettings.supportEmail,
          whatsappNumber: settingsMap.whatsapp_number || defaultSettings.whatsappNumber,
          responseTime: settingsMap.response_time || defaultSettings.responseTime,
          adminNotificationEmail: settingsMap.admin_notification_email || defaultSettings.adminNotificationEmail,
          websiteUrl: settingsMap.website_url || defaultSettings.websiteUrl,
          metaDescription: settingsMap.meta_description || defaultSettings.metaDescription,
          metaKeywords: settingsMap.meta_keywords || defaultSettings.metaKeywords,
          ogImageUrl: settingsMap.og_image_url || "",
        });
      }
    } catch (error) {
      console.error("Error in fetchSettings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: boolean | string | number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: String(value) })
        .eq("key", key);

      if (error) {
        console.error("Error updating setting:", error);
        return false;
      }

      await fetchSettings();
      return true;
    } catch (error) {
      console.error("Error in updateSetting:", error);
      return false;
    }
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSetting,
        refresh: fetchSettings,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context;
}
