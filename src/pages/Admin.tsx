import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminPlans } from "@/components/admin/AdminPlans";
import { AdminCreditPacks } from "@/components/admin/AdminCreditPacks";
import { AdminCreditPackPurchases } from "@/components/admin/AdminCreditPackPurchases";
import { AdminRevenue } from "@/components/admin/AdminRevenue";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminFileReviewerConfig } from "@/components/admin/AdminFileReviewerConfig";
import { AdminUpgradeRequests } from "@/components/admin/AdminUpgradeRequests";
import { AdminPromoCodes } from "@/components/admin/AdminPromoCodes";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { AdminTestimonials } from "@/components/admin/AdminTestimonials";
import { AdminFAQs } from "@/components/admin/AdminFAQs";

export default function Admin() {
  return (
    <AdminLayout>
      <AdminProtectedRoute>
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/upgrade-requests" element={<AdminUpgradeRequests />} />
          <Route path="/plans" element={<AdminPlans />} />
          <Route path="/credit-packs" element={<AdminCreditPacks />} />
          <Route path="/credit-pack-purchases" element={<AdminCreditPackPurchases />} />
          <Route path="/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/referrals" element={<AdminReferrals />} />
          <Route path="/revenue" element={<AdminRevenue />} />
          <Route path="/notifications" element={<AdminNotifications />} />
          <Route path="/file-reviewer" element={<AdminFileReviewerConfig />} />
          <Route path="/testimonials" element={<AdminTestimonials />} />
          <Route path="/faqs" element={<AdminFAQs />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminProtectedRoute>
    </AdminLayout>
  );
}
