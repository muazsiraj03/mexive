import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="shrink-0" />
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
        {description && (
          <p className="hidden text-sm text-muted-foreground md:block">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 rounded-full bg-muted/50 pl-9 focus:bg-background"
          />
        </div>
        
        <ThemeToggle />
        <NotificationDropdown />
      </div>
    </header>
  );
}

export { DashboardBreadcrumb };
