import { create } from "zustand";
import supabase from "@/lib/supabase";

export const useDashboardStore = create((set) => ({
  stats: {
    totalUsers: 0,
    premiumUsers: 0,
    totalTests: 0,
    activeTests: 0,
  },
  recentUsers: [],
  recentTests: [],
  usersByStatus: [],
  testsByType: [],
  testsByDifficulty: [],
  loading: false,

  fetchDashboardStats: async () => {
    set({ loading: true });
    try {
      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: premiumUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "premium");

   
      // Fetch test stats
      const { count: totalTests } = await supabase
        .from("test")
        .select("*", { count: "exact", head: true });

      const { count: activeTests } = await supabase
        .from("test")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch recent users (last 5)
      const { data: recentUsers } = await supabase
        .from("users")
        .select("id, full_name, email, subscription_status, joined_at, avatar_image")
        .order("joined_at", { ascending: false })
        .limit(5);

      // Fetch recent tests (last 5)
      const { data: recentTests } = await supabase
        .from("test")
        .select("id, title, type, difficulty, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch users grouped by status
      const { data: allUsers } = await supabase
        .from("users")
        .select("subscription_status");

      const statusCounts = {};
      (allUsers || []).forEach((u) => {
        const status = u.subscription_status || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const usersByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Fetch tests grouped by type
      const { data: allTests } = await supabase.from("test").select("type, difficulty");

      const typeCounts = {};
      const difficultyCounts = {};
      (allTests || []).forEach((t) => {
        const type = t.type || "Unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        const diff = t.difficulty || "Unknown";
        difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;
      });

      const testsByType = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value,
      }));
      const testsByDifficulty = Object.entries(difficultyCounts).map(
        ([name, value]) => ({ name, value })
      );

      set({
        stats: {
          totalUsers: totalUsers || 0,
          premiumUsers: premiumUsers || 0,
          totalTests: totalTests || 0,
          activeTests: activeTests || 0,
        },
        recentUsers: recentUsers || [],
        recentTests: recentTests || [],
        usersByStatus,
        testsByType,
        testsByDifficulty,
        loading: false,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      set({ loading: false });
    }
  },
}));

