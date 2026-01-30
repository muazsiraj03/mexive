import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardProvider } from "@/hooks/use-dashboard";
import { PresenceTracker } from "@/components/PresenceTracker";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <PresenceTracker />
        <div className="flex min-h-screen w-full">
          <DashboardSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DashboardProvider>
  );
}
