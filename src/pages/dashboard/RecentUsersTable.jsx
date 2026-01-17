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
import { format } from "date-fns";

export default function RecentUsersTable({ users }) {
  const navigate = useNavigate();

  const formattedDate = (date) => {
    const simpleDate = format(new Date(date), "MMM dd, yyyy HH:mm");

    return simpleDate;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Premium":
        return "default";
      case "Active":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Latest registered users</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {user.avatar_image ? (
                      <img
                        src={user.avatar_image}
                        alt={user.full_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {user.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.full_name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(user.subscription_status)}>
                    {user.subscription_status || "Free"}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500">
                  {formattedDate(user.joined_at)}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => navigate(`/users/edit/${user.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

