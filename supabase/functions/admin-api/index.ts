import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/admin-api", "");
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Create service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role using has_role function
    const { data: hasAdminRole, error: roleError } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Special endpoint to check admin status (doesn't require admin role)
    if (path === "/check-admin" && req.method === "GET") {
      console.log("Admin check result:", hasAdminRole);
      return new Response(
        JSON.stringify({ isAdmin: hasAdminRole === true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other endpoints require admin role
    if (!hasAdminRole) {
      console.log("User is not admin");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified, processing request:", path);

    // Route handling
    switch (true) {
      // GET /stats - Dashboard statistics
      case path === "/stats" && req.method === "GET": {
        const [usersResult, subscriptionsResult, upgradeRequestsResult, recentProfilesResult] = await Promise.all([
          adminClient.from("profiles").select("id, created_at", { count: "exact" }),
          adminClient.from("subscriptions").select("plan, status, user_id", { count: "exact" }),
          adminClient.from("upgrade_requests").select("requested_price_cents, status").eq("status", "approved"),
          adminClient.from("profiles").select("id, user_id, full_name, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

        // Calculate stats
        const totalUsers = usersResult.count || 0;
        const activeSubscriptions = subscriptionsResult.data?.filter(s => s.status === "active").length || 0;
        
        // Calculate total revenue from approved upgrade requests
        const totalRevenue = upgradeRequestsResult.data?.reduce((sum, r) => sum + (r.requested_price_cents || 0), 0) || 0;
        
        // Calculate MRR (sum of active subscription values - simplified)
        const subscriptionsByPlan = subscriptionsResult.data?.filter(s => s.status === "active").reduce((acc, s) => {
          acc[s.plan] = (acc[s.plan] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Plan pricing (in cents)
        const planPrices: Record<string, number> = { free: 0, pro: 1999, enterprise: 9999 };
        const mrr = Object.entries(subscriptionsByPlan).reduce((sum, [plan, count]) => {
          return sum + (planPrices[plan] || 0) * count;
        }, 0);

        // User growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersLast30Days = usersResult.data?.filter(
          u => new Date(u.created_at) >= thirtyDaysAgo
        ).length || 0;

        // Build subscription map for recent users
        const subscriptionMap = new Map<string, string>();
        subscriptionsResult.data?.forEach(s => {
          subscriptionMap.set(s.user_id, s.plan);
        });

        // Enrich recent users with plan data
        const recentUsers = (recentProfilesResult.data || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          plan: subscriptionMap.get(profile.user_id) || "free",
          created_at: profile.created_at,
        }));

        return new Response(
          JSON.stringify({
            totalUsers,
            activeSubscriptions,
            totalRevenue,
            mrr,
            newUsersLast30Days,
            subscriptionsByPlan,
            recentUsers,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /tool-stats - Platform-wide tool usage statistics
      case path === "/tool-stats" && req.method === "GET": {
        const [generationsResult, promptsResult, reviewsResult] = await Promise.all([
          adminClient.from("generations").select("id", { count: "exact" }),
          adminClient.from("prompt_history").select("id", { count: "exact" }),
          adminClient.from("file_reviews").select("id, verdict", { count: "exact" }),
        ]);

        const totalReviews = reviewsResult.count || 0;
        const passedReviews = reviewsResult.data?.filter(r => r.verdict === "pass").length || 0;
        const reviewPassRate = totalReviews > 0 ? (passedReviews / totalReviews) * 100 : 0;

        return new Response(
          JSON.stringify({
            totalGenerations: generationsResult.count || 0,
            totalPrompts: promptsResult.count || 0,
            totalReviews,
            reviewPassRate,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /user-growth - Daily user signups for the last 30 days
      case path === "/user-growth" && req.method === "GET": {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: users, error } = await adminClient
          .from("profiles")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (error) {
          console.error("User growth fetch error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch growth data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Group by date
        const dailySignups: Record<string, number> = {};
        users?.forEach(u => {
          const date = new Date(u.created_at).toISOString().split("T")[0];
          dailySignups[date] = (dailySignups[date] || 0) + 1;
        });

        // Fill in missing days with 0
        const growth: Array<{ date: string; users: number }> = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          growth.push({ date: dateStr, users: dailySignups[dateStr] || 0 });
        }

        return new Response(
          JSON.stringify({ growth }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /users - Paginated user list
      case path === "/users" && req.method === "GET": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search") || "";
        const planFilter = url.searchParams.get("plan") || "";
        const offset = (page - 1) * limit;

        // Fetch profiles separately (no FK relationship exists)
        let profileQuery = adminClient
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, created_at, updated_at", { count: "exact" });

        if (search) {
          profileQuery = profileQuery.ilike("full_name", `%${search}%`);
        }

        const { data: profiles, count, error: profileError } = await profileQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (profileError) {
          console.error("Users fetch error:", profileError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch subscriptions for these users
        const userIds = (profiles || []).map(p => p.user_id);
        const { data: subscriptions } = await adminClient
          .from("subscriptions")
          .select("user_id, plan, credits_remaining, credits_total, bonus_credits, status")
          .in("user_id", userIds);

        // Fetch pricing config to check which plans are unlimited and get default credits
        const { data: pricingConfig } = await adminClient
          .from("pricing_config")
          .select("plan_name, is_unlimited, credits");

        // Build unlimited plans set and plan credits map
        const unlimitedPlans = new Set(
          (pricingConfig || []).filter(p => p.is_unlimited).map(p => p.plan_name)
        );
        const planCreditsMap = new Map<string, number>();
        (pricingConfig || []).forEach(p => {
          planCreditsMap.set(p.plan_name, p.credits);
        });

        // Build subscription map
        const subscriptionMap = new Map<string, any>();
        subscriptions?.forEach(s => {
          subscriptionMap.set(s.user_id, s);
        });

        // Combine profile and subscription data
        let users = (profiles || []).map((profile: any) => {
          const sub = subscriptionMap.get(profile.user_id) || {};
          const plan = sub.plan || "free";
          const isUnlimited = unlimitedPlans.has(plan);
          const planDefaultCredits = planCreditsMap.get(plan) || 2;
          // Use plan's default credits as total if not set or if zero
          const baseCredits = sub.credits_total > 0 ? sub.credits_total : planDefaultCredits;
          const bonusCredits = sub.bonus_credits || 0;
          // Total credits = base plan credits + bonus credits
          const totalCredits = baseCredits + bonusCredits;
          return {
            id: profile.user_id || profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            plan: plan,
            credits: sub.credits_remaining || 0,
            total_credits: totalCredits,
            bonus_credits: bonusCredits,
            has_unlimited_credits: isUnlimited,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        });

        // Apply plan filter if specified
        if (planFilter) {
          users = users.filter(u => u.plan === planFilter);
        }

        return new Response(
          JSON.stringify({
            users,
            total: planFilter ? users.length : count,
            page,
            limit,
            totalPages: Math.ceil((planFilter ? users.length : count || 0) / limit),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // PATCH /users/:id - Update user
      case path.startsWith("/users/") && !path.includes("/roles") && !path.includes("/role") && req.method === "PATCH": {
        const targetUserId = path.replace("/users/", "");
        const body = await req.json();
        
        console.log("Updating user:", targetUserId, "with:", body);
        
        // Handle profile updates
        const profileFields = ["full_name", "avatar_url"];
        const profileUpdates: Record<string, unknown> = {};
        for (const field of profileFields) {
          if (body[field] !== undefined) {
            profileUpdates[field] = body[field];
          }
        }

        // Handle subscription updates
        const subUpdates: Record<string, unknown> = {};
        
        // When plan changes, update status to active and set expiration
        if (body.plan !== undefined) {
          subUpdates.plan = body.plan;
          subUpdates.status = "active";
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          subUpdates.expires_at = expiresAt.toISOString();
          subUpdates.started_at = new Date().toISOString();
        }
        
        // When credits are updated, also update credits_total
        if (body.credits !== undefined) {
          subUpdates.credits_remaining = body.credits;
          subUpdates.credits_total = body.credits;
        }

        if (Object.keys(profileUpdates).length === 0 && Object.keys(subUpdates).length === 0) {
          return new Response(
            JSON.stringify({ error: "No valid fields to update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile if needed
        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await adminClient
            .from("profiles")
            .update(profileUpdates)
            .eq("user_id", targetUserId);

          if (profileError) {
            console.error("Profile update error:", profileError);
          }
        }

        // Update subscription if needed
        if (Object.keys(subUpdates).length > 0) {
          console.log("Updating subscription for user:", targetUserId, "with:", subUpdates);
          const { error: subError } = await adminClient
            .from("subscriptions")
            .update(subUpdates)
            .eq("user_id", targetUserId);

          if (subError) {
            console.error("Subscription update error:", subError);
            return new Response(
              JSON.stringify({ error: "Failed to update subscription" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        console.log("User update successful for:", targetUserId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /subscriptions - Subscription list
      case path === "/subscriptions" && req.method === "GET": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const status = url.searchParams.get("status") || "";
        const offset = (page - 1) * limit;

        // Fetch subscriptions first
        let subsQuery = adminClient
          .from("subscriptions")
          .select("id, user_id, plan, status, started_at, expires_at, stripe_customer_id, created_at", { count: "exact" });

        if (status) {
          subsQuery = subsQuery.eq("status", status);
        }

        const { data: subscriptionsData, count, error: subsError } = await subsQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (subsError) {
          console.error("Subscriptions fetch error:", subsError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch subscriptions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch profiles for these subscriptions
        const userIds = (subscriptionsData || []).map(s => s.user_id);
        const { data: profilesData } = await adminClient
          .from("profiles")
          .select("user_id, id, full_name, avatar_url")
          .in("user_id", userIds);

        // Build profile map
        const profileMap = new Map<string, any>();
        profilesData?.forEach(p => {
          profileMap.set(p.user_id, p);
        });

        // Combine data
        const subscriptions = (subscriptionsData || []).map(sub => ({
          ...sub,
          profiles: profileMap.get(sub.user_id) || { id: sub.user_id, full_name: null, avatar_url: null },
        }));

        // Get subscription stats
        const { data: statsData } = await adminClient
          .from("subscriptions")
          .select("plan, status");

        const stats = {
          total: statsData?.length || 0,
          active: statsData?.filter(s => s.status === "active").length || 0,
          pending: statsData?.filter(s => s.status === "pending").length || 0,
          canceled: statsData?.filter(s => s.status === "canceled").length || 0,
          expired: statsData?.filter(s => s.status === "expired").length || 0,
          byPlan: statsData?.reduce((acc, s) => {
            acc[s.plan] = (acc[s.plan] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
        };

        return new Response(
          JSON.stringify({
            subscriptions,
            total: count,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
            stats,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /revenue - Revenue data
      case path === "/revenue" && req.method === "GET": {
        const days = parseInt(url.searchParams.get("days") || "30");
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: transactions, error } = await adminClient
          .from("transactions")
          .select("id, amount, currency, type, status, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Transactions fetch error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch revenue data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Group by date
        const dailyRevenue: Record<string, number> = {};
        const completedTransactions = transactions?.filter(t => t.status === "completed") || [];
        
        completedTransactions.forEach(t => {
          const date = new Date(t.created_at).toISOString().split("T")[0];
          dailyRevenue[date] = (dailyRevenue[date] || 0) + t.amount;
        });

        // Calculate totals
        const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
        const revenueByType = completedTransactions.reduce((acc, t) => {
          acc[t.type] = (acc[t.type] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

        // Format for chart
        const chartData = Object.entries(dailyRevenue).map(([date, amount]) => ({
          date,
          amount,
        }));

        return new Response(
          JSON.stringify({
            totalRevenue,
            revenueByType,
            chartData,
            transactions: transactions?.slice(-50) || [], // Last 50 transactions
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /users/:id/roles - Get user roles
      case path.match(/^\/users\/[^/]+\/roles$/) && req.method === "GET": {
        const targetUserId = path.split("/")[2];

        const { data: roles, error } = await adminClient
          .from("user_roles")
          .select("role, created_at")
          .eq("user_id", targetUserId);

        if (error) {
          console.error("Roles fetch error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch roles" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ roles: roles || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /users/:id/role - Assign role to user
      case path.match(/^\/users\/[^/]+\/role$/) && req.method === "POST": {
        const targetUserId = path.split("/")[2];
        const body = await req.json();
        const { role } = body;

        if (!["admin", "moderator", "user"].includes(role)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // First delete existing role if any (user can only have one role at a time in this design)
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId);

        // Insert the new role
        const { data, error } = await adminClient
          .from("user_roles")
          .insert({ user_id: targetUserId, role })
          .select()
          .single();

        if (error) {
          console.error("Role assignment error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to assign role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ role: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE /users/:id/role - Remove role from user
      case path.match(/^\/users\/[^/]+\/role$/) && req.method === "DELETE": {
        const targetUserId = path.split("/")[2];
        const body = await req.json();
        const { role } = body;

        // Prevent self-removal of admin role
        if (targetUserId === userId && role === "admin") {
          return new Response(
            JSON.stringify({ error: "Cannot remove your own admin role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", role);

        if (error) {
          console.error("Role removal error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to remove role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE /users/:id - Delete user completely
      case path.match(/^\/users\/[^/]+$/) && req.method === "DELETE": {
        const targetUserId = path.replace("/users/", "");

        // Prevent self-deletion
        if (targetUserId === userId) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete user from auth (this will cascade to profiles due to trigger)
        const { error } = await adminClient.auth.admin.deleteUser(targetUserId);

        if (error) {
          console.error("User deletion error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to delete user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("User deleted:", targetUserId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /notifications - Create notification (admin only)
      case path === "/notifications" && req.method === "POST": {
        const body = await req.json();
        const { title, message, type = "info", userId, isGlobal = false } = body;

        if (!title || !message) {
          return new Response(
            JSON.stringify({ error: "Title and message are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const notificationData: Record<string, unknown> = {
          title,
          message,
          type,
          is_global: isGlobal,
          created_by: userId,
        };

        // If not global, a specific user_id is required
        if (!isGlobal && userId) {
          notificationData.user_id = userId;
        } else if (!isGlobal) {
          return new Response(
            JSON.stringify({ error: "Either userId or isGlobal must be provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notificationData)
          .select()
          .single();

        if (error) {
          console.error("Notification creation error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create notification" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ notification: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /notifications - Get all notifications (admin view)
      case path === "/notifications" && req.method === "GET": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const { data, count, error } = await adminClient
          .from("notifications")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error("Notifications fetch error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch notifications" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            notifications: data,
            total: count,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE /notifications/:id - Delete notification (admin only)
      case path.match(/^\/notifications\/[^/]+$/) && req.method === "DELETE": {
        const notificationId = path.replace("/notifications/", "");

        const { error } = await adminClient
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (error) {
          console.error("Notification delete error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete notification" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // POST /admins - Create new admin user
      case path === "/admins" && req.method === "POST": {
        const body = await req.json();
        const { email, password, fullName } = body;

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create new user using admin auth API
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || email },
        });

        if (createError) {
          console.error("User creation error:", createError);
          return new Response(
            JSON.stringify({ error: createError.message || "Failed to create user" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!newUser.user) {
          return new Response(
            JSON.stringify({ error: "Failed to create user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Assign admin role to the new user
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: newUser.user.id, role: "admin" });

        if (roleError) {
          console.error("Role assignment error:", roleError);
          // User was created but role assignment failed - still return success but warn
          return new Response(
            JSON.stringify({ 
              user: newUser.user, 
              warning: "User created but admin role assignment failed. Please assign role manually." 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("New admin created:", newUser.user.id);

        return new Response(
          JSON.stringify({ user: newUser.user, success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /admins - List all admin users
      case path === "/admins" && req.method === "GET": {
        const { data: adminRoles, error: rolesError } = await adminClient
          .from("user_roles")
          .select("user_id, role, created_at")
          .eq("role", "admin");

        if (rolesError) {
          console.error("Admin roles fetch error:", rolesError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch admin users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!adminRoles || adminRoles.length === 0) {
          return new Response(
            JSON.stringify({ admins: [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get profiles for admin users
        const adminUserIds = adminRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await adminClient
          .from("profiles")
          .select("id, full_name, avatar_url, created_at")
          .in("id", adminUserIds);

        if (profilesError) {
          console.error("Profiles fetch error:", profilesError);
        }

        // Get auth user emails
        const adminsWithDetails = await Promise.all(
          adminRoles.map(async (role) => {
            const profile = profiles?.find(p => p.id === role.user_id);
            const { data: authUser } = await adminClient.auth.admin.getUserById(role.user_id);
            
            return {
              id: role.user_id,
              email: authUser?.user?.email || "Unknown",
              full_name: profile?.full_name || authUser?.user?.user_metadata?.full_name || null,
              avatar_url: profile?.avatar_url || null,
              role_assigned_at: role.created_at,
              created_at: profile?.created_at || null,
            };
          })
        );

        return new Response(
          JSON.stringify({ admins: adminsWithDetails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE /admins/:id - Remove admin role from user
      case path.match(/^\/admins\/[^/]+$/) && req.method === "DELETE": {
        const targetUserId = path.replace("/admins/", "");

        // Prevent self-removal
        if (targetUserId === userId) {
          return new Response(
            JSON.stringify({ error: "Cannot remove your own admin role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");

        if (error) {
          console.error("Admin role removal error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to remove admin role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE /revenue - Reset all revenue data (transactions)
      case path === "/revenue" && req.method === "DELETE": {
        console.log(`Admin ${userId} is resetting all revenue data`);

        // Delete all transactions
        const { error: transactionsError } = await adminClient
          .from("transactions")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

        if (transactionsError) {
          console.error("Transactions reset error:", transactionsError);
          return new Response(
            JSON.stringify({ error: "Failed to reset transactions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete all credit pack purchases
        const { error: purchasesError } = await adminClient
          .from("credit_pack_purchases")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (purchasesError) {
          console.error("Credit pack purchases reset error:", purchasesError);
        }

        console.log(`Revenue data reset completed by admin ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "All revenue data has been reset" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
