import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BankSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
  paymentInstructions: string;
}

const defaultSettings: BankSettings = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  branch: "",
  swiftCode: "",
  paymentInstructions: "",
};

export function useBankSettings() {
  const [settings, setSettings] = useState<BankSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "bank_name",
          "bank_account_name",
          "bank_account_number",
          "bank_branch",
          "bank_swift_code",
          "payment_instructions",
        ]);

      if (error) {
        console.error("Error fetching bank settings:", error);
        return;
      }

      const settingsMap: Record<string, string> = {};
      data?.forEach((row) => {
        settingsMap[row.key] = row.value || "";
      });

      setSettings({
        bankName: settingsMap.bank_name || "",
        accountName: settingsMap.bank_account_name || "",
        accountNumber: settingsMap.bank_account_number || "",
        branch: settingsMap.bank_branch || "",
        swiftCode: settingsMap.bank_swift_code || "",
        paymentInstructions: settingsMap.payment_instructions || "",
      });
    } catch (error) {
      console.error("Error fetching bank settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<BankSettings>) => {
    const keyMap: Record<keyof BankSettings, string> = {
      bankName: "bank_name",
      accountName: "bank_account_name",
      accountNumber: "bank_account_number",
      branch: "bank_branch",
      swiftCode: "bank_swift_code",
      paymentInstructions: "payment_instructions",
    };

    try {
      for (const [key, value] of Object.entries(newSettings)) {
        const dbKey = keyMap[key as keyof BankSettings];
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
      console.error("Error updating bank settings:", error);
      return false;
    }
  };

  return { settings, loading, updateSettings, refresh: fetchSettings };
}
