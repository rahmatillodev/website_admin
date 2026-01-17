import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export default function DistributionCard({ title, description, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{item.name}</span>
                  <span className="text-gray-500">
                    {item.value} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COLORS[index % COLORS.length]} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-center text-gray-500 py-4">No data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

