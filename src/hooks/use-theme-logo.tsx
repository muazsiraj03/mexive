import { useTheme } from "next-themes";
import { useSystemSettings } from "./use-system-settings";
import logoIcon from "@/assets/logo-icon.png";

/**
 * Returns the appropriate logo based on current theme and admin-configured logos.
 * Falls back to default logo if no custom logos are configured.
 */
export function useThemeLogo() {
  const { resolvedTheme } = useTheme();
  const { settings, loading } = useSystemSettings();

  const isDark = resolvedTheme === "dark";
  
  // Use theme-appropriate logo if configured, otherwise fall back to default
  const logo = isDark 
    ? (settings.logoDarkMode || settings.logoLightMode || logoIcon)
    : (settings.logoLightMode || settings.logoDarkMode || logoIcon);

  return {
    logo,
    logoLightMode: settings.logoLightMode || logoIcon,
    logoDarkMode: settings.logoDarkMode || logoIcon,
    loading,
    hasCustomLogo: Boolean(settings.logoLightMode || settings.logoDarkMode),
  };
}
