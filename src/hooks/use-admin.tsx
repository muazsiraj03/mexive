import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  newUsersLast30Days: number;
  subscriptionsByPlan: Record<string, number>;
  recentUsers: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    plan: string;
    created_at: string;
  }>;
}

interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  credits: number;
  plan_credits: number;
  bonus_credits: number;
  total_credits: number;
  has_unlimited_credits: boolean;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  requested_credits: number | null;
  requested_price_cents: number | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  created_at: string;
}

interface RevenueData {
  totalRevenue: number;
  revenueByType: Record<string, number>;
  chartData: Array<{ date: string; amount: number }>;
  transactions: Transaction[];
}

interface AdminContextType {
  isAdmin: boolean | null;
  loading: boolean;
  stats: AdminStats | null;
  users: User[];
  usersPagination: { total: number; page: number; totalPages: number };
  subscriptions: Subscription[];
  subscriptionStats: { total: number; active: number; canceled: number; expired: number; pending: number; byPlan: Record<string, number> };
  revenueData: RevenueData | null;
  fetchStats: () => Promise<void>;
  fetchUsers: (page?: number, search?: string, plan?: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  fetchSubscriptions: (page?: number, status?: string) => Promise<void>;
  fetchRevenue: (days?: number) => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  approveSubscription: (subscriptionId: string) => Promise<boolean>;
  rejectSubscription: (subscriptionId: string) => Promise<boolean>;
  resetRevenueData: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState({ total: 0, active: 0, canceled: 0, expired: 0, pending: 0, byPlan: {} as Record<string, number> });
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  const callAdminApi = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error("No session");
    }

    const baseUrl = `https://qwnrymtaokajuqtgdaex.supabase.co/functions/v1/admin-api${path}`;
    const res = await fetch(baseUrl, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "API error");
    }

    return res.json();
  }, [session]);

  const checkAdminStatus = useCallback(async () => {
    if (!session?.access_token) {
      setIsAdmin(false);
      setLoading(false);
      return false;
    }

    try {
      const data = await callAdminApi("/check-admin");
      setIsAdmin(data.isAdmin);
      return data.isAdmin;
    } catch (error) {
      console.error("Admin check error:", error);
      setIsAdmin(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, callAdminApi]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await callAdminApi("/stats");
      setStats(data);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  }, [callAdminApi]);

  const fetchUsers = useCallback(async (page = 1, search = "", plan = "") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (plan) params.set("plan", plan);
      
      const data = await callAdminApi(`/users?${params}`);
      setUsers(data.users);
      setUsersPagination({
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  }, [callAdminApi]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    try {
      await callAdminApi(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error("Update user error:", error);
      return false;
    }
  }, [callAdminApi]);

  const fetchSubscriptions = useCallback(async (page = 1, status = "") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (status) params.set("status", status);
      
      const data = await callAdminApi(`/subscriptions?${params}`);
      setSubscriptions(data.subscriptions);
      setSubscriptionStats(data.stats);
    } catch (error) {
      console.error("Fetch subscriptions error:", error);
    }
  }, [callAdminApi]);

  const fetchRevenue = useCallback(async (days = 30) => {
    try {
      const data = await callAdminApi(`/revenue?days=${days}`);
      setRevenueData(data);
    } catch (error) {
      console.error("Fetch revenue error:", error);
    }
  }, [callAdminApi]);

  const approveSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const response = await supabase.functions.invoke("manage-subscription", {
        body: { action: "approve", subscriptionId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (response.error || response.data?.error) {
        console.error("Approve error:", response.error || response.data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Approve subscription error:", error);
      return false;
    }
  }, [session]);

  const rejectSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const response = await supabase.functions.invoke("manage-subscription", {
        body: { action: "reject", subscriptionId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (response.error || response.data?.error) {
        console.error("Reject error:", response.error || response.data?.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Reject subscription error:", error);
      return false;
    }
  }, [session]);

  const resetRevenueData = useCallback(async () => {
    try {
      await callAdminApi("/revenue", { method: "DELETE" });
      setRevenueData(null);
      return true;
    } catch (error) {
      console.error("Reset revenue error:", error);
      return false;
    }
  }, [callAdminApi]);

  useEffect(() => {
    if (session) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [session, checkAdminStatus]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        loading,
        stats,
        users,
        usersPagination,
        subscriptions,
        subscriptionStats,
        revenueData,
        fetchStats,
        fetchUsers,
        updateUser,
        fetchSubscriptions,
        fetchRevenue,
        checkAdminStatus,
        approveSubscription,
        rejectSubscription,
        resetRevenueData,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
