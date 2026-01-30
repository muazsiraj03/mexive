import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminProvider } from "@/hooks/use-admin";
import { AdminSearchProvider } from "@/hooks/use-admin-search";
import { PresenceTracker } from "@/components/PresenceTracker";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <AdminSearchProvider>
        <SidebarProvider>
          <PresenceTracker />
          <div className="flex min-h-screen w-full">
            <AdminSidebar />
            <SidebarInset className="flex flex-1 flex-col">
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AdminSearchProvider>
    </AdminProvider>
  );
}
