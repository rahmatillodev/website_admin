import { useEffect } from "react";
import { Users, Crown, Bell, DollarSign, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import userStore from "@/stores/usersStore";

const metricCards = [
  {
    title: "Total Users",
    value: "12,345",
    icon: Users,
    change: "+12.5%",
    trend: "up",
    color: "text-blue-600",
  },
  {
    title: "Active Premium",
    value: "3,284",
    icon: Crown,
    change: "+8.2%",
    trend: "up",
    color: "text-purple-600",
  },
  {
    title: "Pending Notifications",
    value: "24",
    icon: Bell,
    change: "-5.1%",
    trend: "down",
    color: "text-orange-600",
  },
  {
    title: "Monthly Revenue",
    value: "$48,920",
    icon: DollarSign,
    change: "+15.3%",
    trend: "up",
    color: "text-green-600",
  },
];

const needsAttention = [
  {
    id: 1,
    user: "Ahmed Khan",
    email: "ahmed.k@example.com",
    issue: "Pending Payment Verification",
    priority: "high",
    date: "2 hours ago",
  },
  {
    id: 2,
    user: "Sarah Jenkins",
    email: "sarah.j@example.com",
    issue: "Account Activation Required",
    priority: "medium",
    date: "5 hours ago",
  },
  {
    id: 3,
    user: "Li Wei",
    email: "l.wei@example.com",
    issue: "Subscription Renewal Reminder",
    priority: "low",
    date: "1 day ago",
  },
];

const recentActivity = [
  {
    id: 1,
    action: "New user registered",
    user: "Emily Davis",
    time: "5 minutes ago",
    type: "user",
  },
  {
    id: 2,
    action: "Premium subscription purchased",
    user: "Michael Johnson",
    time: "15 minutes ago",
    type: "premium",
  },
  {
    id: 3,
    action: "Test completed",
    test: "Academic Reading Test 14",
    time: "1 hour ago",
    type: "test",
  },
  {
    id: 4,
    action: "Content updated",
    item: "General Listening Test 05",
    time: "2 hours ago",
    type: "content",
  },
];

export default function Dashboard() {
 
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with IELTS Sim today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <TrendingUp
                  className={`h-3 w-3 ${
                    card.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={
                    card.trend === "up" ? "text-green-600" : "text-red-600"
                  }
                >
                  {card.change}
                </span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs Attention Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
          <CardDescription>
            Items requiring your immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {needsAttention.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.user}</div>
                      <div className="text-sm text-gray-500">{item.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.issue}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                          ? "pending"
                          : "secondary"
                      }
                    >
                      {item.priority.charAt(0).toUpperCase() +
                        item.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{item.date}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Review
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and events in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  {index !== recentActivity.length - 1 && (
                    <div className="h-16 w-0.5 bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {activity.action}
                      </span>
                      {activity.user && (
                        <span className="text-sm text-gray-600 ml-1">
                          — {activity.user}
                        </span>
                      )}
                      {activity.test && (
                        <span className="text-sm text-gray-600 ml-1">
                          — {activity.test}
                        </span>
                      )}
                      {activity.item && (
                        <span className="text-sm text-gray-600 ml-1">
                          — {activity.item}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
