import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OverviewPage } from "@/components/dashboard/OverviewPage";
import { GeneratePage } from "@/components/dashboard/GeneratePage";
import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { SubscriptionPage } from "@/components/dashboard/SubscriptionPage";
import { ImageToPromptPage } from "@/components/dashboard/ImageToPromptPage";
import { FileReviewerPage } from "@/components/dashboard/FileReviewerPage";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="generate" element={<GeneratePage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="image-to-prompt" element={<ImageToPromptPage />} />
        <Route path="file-reviewer" element={<FileReviewerPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
