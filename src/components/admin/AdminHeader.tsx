import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdminSearch } from "@/hooks/use-admin-search";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { globalSearch, setGlobalSearch, clearSearch } = useAdminSearch();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="shrink-0" />
      
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground md:text-xl truncate">{title}</h1>
        {description && (
          <p className="hidden text-sm text-muted-foreground md:block truncate">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-64 rounded-full bg-muted/50 pl-9 pr-9 focus:bg-background"
          />
          {globalSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-transparent"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        
        <ThemeToggle />
        <NotificationDropdown />
      </div>
    </header>
  );
}
