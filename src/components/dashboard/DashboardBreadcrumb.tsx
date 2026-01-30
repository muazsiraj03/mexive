import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "": "Overview",
  generate: "Generate",
  history: "History",
  subscription: "Subscription",
  settings: "Settings",
};

export function DashboardBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Remove "dashboard" from segments for display
  const displaySegments = pathSegments.slice(1);
  const isRoot = displaySegments.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {displaySegments.map((segment, index) => {
          const isLast = index === displaySegments.length - 1;
          const path = `/dashboard/${displaySegments.slice(0, index + 1).join("/")}`;
          const label = routeLabels[segment] || segment;

          return (
            <BreadcrumbItem key={path}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={path}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
