import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  ArrowLeft,
  Bell,
  Package,
  DollarSign,
  FileSearch,
  ClipboardCheck,
  Tag,
  ShoppingCart,
  Gift,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Upgrade Requests",
    href: "/admin/upgrade-requests",
    icon: ClipboardCheck,
  },
  {
    title: "Plans",
    href: "/admin/plans",
    icon: DollarSign,
  },
  {
    title: "Credit Packs",
    href: "/admin/credit-packs",
    icon: Package,
  },
  {
    title: "Pack Purchases",
    href: "/admin/credit-pack-purchases",
    icon: ShoppingCart,
  },
  {
    title: "Promo Codes",
    href: "/admin/promo-codes",
    icon: Tag,
  },
  {
    title: "Referrals",
    href: "/admin/referrals",
    icon: Gift,
  },
  {
    title: "Revenue",
    href: "/admin/revenue",
    icon: TrendingUp,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "File Reviewer",
    href: "/admin/file-reviewer",
    icon: FileSearch,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 px-4 py-4">
        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="font-semibold truncate">Admin Panel</h2>
              <p className="text-xs text-muted-foreground truncate">Manage your SaaS</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Management</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.href);
                  
                const linkContent = (
                  <NavLink
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors w-full",
                      "hover:bg-secondary/10 hover:text-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-popover text-popover-foreground border">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="w-full" asChild>
                <NavLink to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </NavLink>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground border">
              Back to Dashboard
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </NavLink>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
