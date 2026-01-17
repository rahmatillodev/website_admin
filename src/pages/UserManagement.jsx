import {  useState, useCallback } from "react";
import { Search, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { format } from "date-fns";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "@/components/modals/ConfirmModal";
import Pagination from "@/components/Pagination";

export default function UserManagement() {
  const {
    users,
    loading,
    fetchUsers,
    totalCount,
    currentPage,
    pageSize,
    deleteUser,
  } = userStore();
  const navigate = useNavigate();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    isLoading: false,
  });

  // Local state qidiruvni tezkor ko'rsatish uchun
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("All");

  // 2. Debounced Search funksiyasi
  const debouncedSearch = useCallback(
    debounce((query, currentStatus) => {
      fetchUsers(1, pageSize, query, currentStatus);
    }, 500),
    [pageSize]
  );

  // Qidiruv o'zgarganda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value, status);
  };

  // Status o'zgarganda
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    fetchUsers(1, pageSize, searchTerm, newStatus);
  };

  // Pagination o'zgarganda (mavjud qidiruv va statusni saqlab qolamiz)
  const handlePageChange = (newPage) => {
    fetchUsers(newPage, pageSize, searchTerm, status);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    fetchUsers(1, newLimit, searchTerm, status);
  };

  const formattedDate = (date) => {
    const simpleDate = format(new Date(date), "MMM dd, yyyy");

    return simpleDate;
  };

  const handleDeleteClick = (user) => {
    setDeleteModal({
      isOpen: true,
      userId: user.id,
      userName: user.full_name,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.userId) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    const result = await deleteUser(deleteModal.userId);

    if (result.success) {
      setDeleteModal({
        isOpen: false,
        userId: null,
        userName: "",
        isLoading: false,
      });
    } else {
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userName: "",
      isLoading: false,
    });
  };

  const handleEditClick = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500">Home {">"} User Management</div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <select
              value={status}
              onChange={handleStatusChange}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="All">Status: All</option>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>USER NAME</TableHead>
                <TableHead>USER EMAIL</TableHead>
                <TableHead>SUBSCRIPTION STATUS</TableHead>
                <TableHead>JOIN DATE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <img
                        src={
                          user.avatar_image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.full_name
                          )}&background=0d9488&color=fff`
                        }
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.full_name}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription_status}>
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formattedDate(user.joined_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.subscription === "Pending Payment" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Verify
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
     <Pagination
     currentPage={currentPage}
     pageSize={pageSize}
     totalCount={totalCount}
     handlePageChange={handlePageChange}
     handleLimitChange={handleLimitChange}
     title="users"
     loading={loading}
     />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Foydalanuvchini o'chirish"
        message={`"${deleteModal.userName}" foydalanuvchisini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        isLoading={deleteModal.isLoading}
        status="error"
      />
    </div>
  );
}
