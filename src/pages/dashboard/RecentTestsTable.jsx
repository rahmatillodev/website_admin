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
import { useNavigate } from "react-router-dom";

export default function RecentTestsTable({ tests }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDifficultyVariant = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "hard":
        return "destructive";
      case "medium":
        return "pending";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Tests</CardTitle>
        <CardDescription>Latest created tests</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-medium">{test.title}</TableCell>
                <TableCell className="capitalize">{test.type || "-"}</TableCell>
                <TableCell>
                  <Badge variant={getDifficultyVariant(test.difficulty)}>
                    {test.difficulty || "Unknown"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={test.is_active ? "default" : "outline"}>
                    {test.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => navigate(`/content/edit/${test.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {tests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No tests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

