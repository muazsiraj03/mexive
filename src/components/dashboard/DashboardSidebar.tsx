import { Home, Wand2, Settings, Sparkles, LogOut, Shield, CreditCard, MessageSquareText, FileSearch } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useThemeLogo } from "@/hooks/use-theme-logo";
import logoIconLight from "@/assets/logo-icon-light.png";
import logoIconDark from "@/assets/logo-icon-dark.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Subscription", url: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const toolsItems = [
  { title: "Metadata Generator", url: "/dashboard/generate", icon: Wand2 },
  { title: "Image to Prompt", url: "/dashboard/image-to-prompt", icon: MessageSquareText },
  { title: "File Reviewer", url: "/dashboard/file-reviewer", icon: FileSearch },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { user, isAdmin } = useDashboard();
  const { signOut } = useAuth();
  const { settings } = useSystemSettings();
  const { logo } = useThemeLogo();
  const { resolvedTheme } = useTheme();
  const collapsed = state === "collapsed";
  const logoIcon = resolvedTheme === "dark" ? logoIconLight : logoIconDark;

  const sizeClasses = {
    small: collapsed ? "h-6 w-6" : "h-8 w-auto max-w-[120px]",
    medium: collapsed ? "h-8 w-8" : "h-10 w-auto max-w-[140px]",
    large: collapsed ? "h-10 w-10" : "h-12 w-auto max-w-[160px]",
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={collapsed ? "p-2" : "p-4"}>
        <Link to="/" className={`flex items-center ${collapsed ? "justify-center" : "justify-start"}`}>
          {collapsed ? (
            <img 
              src={logoIcon} 
              alt={settings.appName} 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <img 
              src={logo} 
              alt={settings.appName} 
              className={`object-contain transition-all ${sizeClasses[settings.logoSize]}`}
            />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={`flex items-center rounded-lg text-muted-foreground transition-smooth hover:bg-secondary/10 hover:text-foreground ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"}`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={`flex items-center rounded-lg text-muted-foreground transition-smooth hover:bg-secondary/10 hover:text-foreground ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"}`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Panel">
                    <NavLink
                      to="/admin"
                      className={`flex items-center rounded-lg text-muted-foreground transition-smooth hover:bg-secondary/10 hover:text-foreground ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"}`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={collapsed ? "p-2" : "p-4"}>
        {/* Credits Badge - only show icon when collapsed */}
        {!collapsed ? (
          <div className="mb-4 rounded-xl bg-secondary/10 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Credits</p>
                <p className="font-semibold text-foreground">
                  {isAdmin ? "∞ Unlimited" : `${user.credits} / ${user.totalCredits}`}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* User Profile */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-muted text-sm font-medium">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={handleLogout}
          className={`mt-3 text-muted-foreground hover:bg-secondary/10 hover:text-foreground ${collapsed ? "mx-auto h-9 w-9" : "w-full justify-start"}`}
          title="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Log out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}