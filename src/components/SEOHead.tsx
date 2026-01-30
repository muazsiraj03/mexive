import { useEffect } from "react";
import { useSystemSettings } from "@/hooks/use-system-settings";

/**
 * Dynamically updates the document head with branding and SEO settings.
 * Should be rendered once in the app root.
 */
export function SEOHead() {
  const { settings, loading } = useSystemSettings();

  useEffect(() => {
    if (loading) return;

    // Update document title
    if (settings.browserTitle) {
      document.title = settings.browserTitle;
    }

    // Update favicon
    if (settings.faviconUrl) {
      let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement("link");
        faviconLink.rel = "icon";
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = settings.faviconUrl;
      
      // Also update apple-touch-icon if we have one
      let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement("link");
        appleTouchIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = settings.faviconUrl;
    }

    // Update meta description
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = settings.metaDescription;

    // Update meta keywords
    let metaKeywords = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.name = "keywords";
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = settings.metaKeywords;

    // Update OG tags
    const updateOgTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property='${property}']`) as HTMLMetaElement;
      if (!ogTag) {
        ogTag = document.createElement("meta");
        ogTag.setAttribute("property", property);
        document.head.appendChild(ogTag);
      }
      ogTag.content = content;
    };

    updateOgTag("og:title", settings.browserTitle || settings.appName);
    updateOgTag("og:description", settings.metaDescription);
    updateOgTag("og:site_name", settings.appName);
    
    if (settings.ogImageUrl) {
      updateOgTag("og:image", settings.ogImageUrl);
    }

    // Update Twitter card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement;
      if (!twitterTag) {
        twitterTag = document.createElement("meta");
        twitterTag.name = name;
        document.head.appendChild(twitterTag);
      }
      twitterTag.content = content;
    };

    updateTwitterTag("twitter:card", settings.ogImageUrl ? "summary_large_image" : "summary");
    updateTwitterTag("twitter:title", settings.browserTitle || settings.appName);
    updateTwitterTag("twitter:description", settings.metaDescription);
    
    if (settings.ogImageUrl) {
      updateTwitterTag("twitter:image", settings.ogImageUrl);
    }

  }, [settings, loading]);

  return null;
}
