import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, color, subtitle, trend, trendType }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium ${trendType === "up" ? "text-green-600" : "text-red-600"}`}>
              {trendType === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trendType === "up" ? "+" : "-"}{Math.abs(trend)}% last month
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

