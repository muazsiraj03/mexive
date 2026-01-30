import { useMemo } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePricing } from "@/hooks/use-pricing";

export type ToolId = "metadata-generator" | "image-to-prompt" | "file-reviewer";

export interface ToolAccessInfo {
  hasAccess: boolean;
  isLoading: boolean;
  userPlan: string;
  availableTools: ToolId[];
  lockedTools: ToolId[];
}

const ALL_TOOLS: ToolId[] = ["metadata-generator", "image-to-prompt", "file-reviewer"];

export function useToolAccess(toolId?: ToolId): ToolAccessInfo {
  const { user, isAdmin, loading: dashboardLoading } = useDashboard();
  const { plans, loading: pricingLoading } = usePricing();

  const accessInfo = useMemo(() => {
    const isLoading = dashboardLoading || pricingLoading;
    const userPlan = user.plan || "free";

    // Admins have access to all tools
    if (isAdmin) {
      return {
        hasAccess: true,
        isLoading,
        userPlan,
        availableTools: ALL_TOOLS,
        lockedTools: [],
      };
    }

    // Find the user's current plan config (use name which is plan_name)
    const currentPlanConfig = plans.find(
      (p) => p.name.toLowerCase() === userPlan.toLowerCase()
    );

    // Get tools access from plan config, default to all tools if not specified
    const planToolsAccess = currentPlanConfig?.tools_access || ALL_TOOLS;
    
    const availableTools = planToolsAccess.filter((t): t is ToolId => 
      ALL_TOOLS.includes(t as ToolId)
    );
    
    const lockedTools = ALL_TOOLS.filter((t) => !availableTools.includes(t));

    const hasAccess = toolId ? availableTools.includes(toolId) : true;

    return {
      hasAccess,
      isLoading,
      userPlan,
      availableTools,
      lockedTools,
    };
  }, [user.plan, isAdmin, plans, dashboardLoading, pricingLoading, toolId]);

  return accessInfo;
}

export function getToolDisplayName(toolId: ToolId): string {
  const names: Record<ToolId, string> = {
    "metadata-generator": "Metadata Generator",
    "image-to-prompt": "Image to Prompt",
    "file-reviewer": "File Reviewer",
  };
  return names[toolId] || toolId;
}
