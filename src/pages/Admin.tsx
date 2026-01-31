import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminPlans } from "@/components/admin/AdminPlans";
import { AdminCreditPacks } from "@/components/admin/AdminCreditPacks";
import { AdminRevenue } from "@/components/admin/AdminRevenue";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminFileReviewerConfig } from "@/components/admin/AdminFileReviewerConfig";
import { AdminUpgradeRequests } from "@/components/admin/AdminUpgradeRequests";

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
          <Route path="/revenue" element={<AdminRevenue />} />
          <Route path="/notifications" element={<AdminNotifications />} />
          <Route path="/file-reviewer" element={<AdminFileReviewerConfig />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminProtectedRoute>
    </AdminLayout>
  );
}
