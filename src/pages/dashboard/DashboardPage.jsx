import { useEffect } from "react";
import { Users, Crown, FileText, CheckCircle, Activity } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import StatsCard from "./StatsCard";
import RecentUsersTable from "./RecentUsersTable";
import RecentTestsTable from "./RecentTestsTable";
import DistributionCard from "./DistributionCard";

// Placeholder trend generator until real trend data is available from the store
const getPlaceholderTrend = (key) => {
  const trends = {
    totalUsers: { trend: null, trendType: null },
    premiumUsers: { trend: null, trendType: null },
    totalTests: { trend: null, trendType: null },
    activeTests: { trend: null, trendType: null },
  };
  return trends[key] || { trend: null, trendType: null };
};

const statsConfig = [
  { key: "totalUsers", title: "Total Users", icon: Users, color: "text-blue-600", subtitle: "All users" },
  { key: "premiumUsers", title: "Premium Users", icon: Crown, color: "text-purple-600", subtitle: "Paid subscriptions" },
  { key: "totalTests", title: "Total Tests", icon: FileText, color: "text-orange-600", subtitle: "All tests" },
  { key: "activeTests", title: "Active Tests", icon: CheckCircle, color: "text-green-600", subtitle: "Currently available" },
];

export default function DashboardPage() {
  const {
    stats,
    recentUsers,
    recentTests,
    usersByStatus,
    testsByType,
    testsByDifficulty,
    loading,
    fetchDashboardStats,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statsCards = statsConfig.map((config) => ({
    ...config,
    value: stats[config.key],
    ...getPlaceholderTrend(config.key),
  }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's your IELTS Sim overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <DistributionCard
          title="Users by Status"
          description="Subscription distribution"
          data={usersByStatus}
        />
        <DistributionCard
          title="Tests by Type"
          description="Test type distribution"
          data={testsByType}
        />
        <DistributionCard
          title="Tests by Difficulty"
          description="Difficulty level distribution"
          data={testsByDifficulty}
        />
      </div>

      {/* Recent Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentUsersTable users={recentUsers} />
        <RecentTestsTable tests={recentTests} />
      </div>
    </div>
  );
}

