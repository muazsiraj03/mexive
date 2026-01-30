import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { AdminProvider } from "@/hooks/use-admin";
import { SystemSettingsProvider } from "@/hooks/use-system-settings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SEOHead } from "@/components/SEOHead";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SystemSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SEOHead />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route
                  path="/"
                  element={
                    <MaintenanceGuard>
                      <Index />
                    </MaintenanceGuard>
                  }
                />
                <Route
                  path="/auth"
                  element={
                    <MaintenanceGuard>
                      <Auth />
                    </MaintenanceGuard>
                  }
                />
                <Route
                  path="/dashboard/*"
                  element={
                    <MaintenanceGuard>
                      <ProtectedRoute>
                        <NotificationsProvider>
                          <Dashboard />
                        </NotificationsProvider>
                      </ProtectedRoute>
                    </MaintenanceGuard>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <MaintenanceGuard bypassForAdmin>
                      <ProtectedRoute>
                        <AdminProvider>
                          <NotificationsProvider>
                            <Admin />
                          </NotificationsProvider>
                        </AdminProvider>
                      </ProtectedRoute>
                    </MaintenanceGuard>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SystemSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
