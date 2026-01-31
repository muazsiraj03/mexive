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
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Cookies from "./pages/Cookies";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Careers from "./pages/Careers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
                {/* Legal & Company Pages */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/careers" element={<Careers />} />
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
