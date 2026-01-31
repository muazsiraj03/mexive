import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BkashSettings {
  personalNumber: string;
  merchantNumber: string;
  agentNumber: string;
  paymentInstructions: string;
}

const defaultSettings: BkashSettings = {
  personalNumber: "",
  merchantNumber: "",
  agentNumber: "",
  paymentInstructions: "",
};

export function useBkashSettings() {
  const [settings, setSettings] = useState<BkashSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "bkash_personal_number",
          "bkash_merchant_number",
          "bkash_agent_number",
          "bkash_payment_instructions",
        ]);

      if (error) {
        console.error("Error fetching bKash settings:", error);
        return;
      }

      const settingsMap: Record<string, string> = {};
      data?.forEach((row) => {
        settingsMap[row.key] = row.value || "";
      });

      setSettings({
        personalNumber: settingsMap.bkash_personal_number || "",
        merchantNumber: settingsMap.bkash_merchant_number || "",
        agentNumber: settingsMap.bkash_agent_number || "",
        paymentInstructions: settingsMap.bkash_payment_instructions || "",
      });
    } catch (error) {
      console.error("Error fetching bKash settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<BkashSettings>) => {
    const keyMap: Record<keyof BkashSettings, string> = {
      personalNumber: "bkash_personal_number",
      merchantNumber: "bkash_merchant_number",
      agentNumber: "bkash_agent_number",
      paymentInstructions: "bkash_payment_instructions",
    };

    try {
      for (const [key, value] of Object.entries(newSettings)) {
        const dbKey = keyMap[key as keyof BkashSettings];
        if (dbKey) {
          const { error } = await supabase
            .from("system_settings")
            .upsert(
              { key: dbKey, value: value as string },
              { onConflict: "key" }
            );

          if (error) {
            console.error(`Error updating ${dbKey}:`, error);
            return false;
          }
        }
      }

      setSettings((prev) => ({ ...prev, ...newSettings }));
      return true;
    } catch (error) {
      console.error("Error updating bKash settings:", error);
      return false;
    }
  };

  return { settings, loading, updateSettings, refresh: fetchSettings };
}
