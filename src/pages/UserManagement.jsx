import { useEffect } from 'react'
import { Plus, Search, Download, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useContentStore from '@/stores/contentStore'

export default function UserManagement() {
  const { users, loading, fetchUsers } = useContentStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500">
        Home {'>'} User Management
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
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
              />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Status: All</option>
              <option>Premium</option>
              <option>Free</option>
              <option>Pending Payment</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Date: Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
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
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead>USER PROFILE</TableHead>
                <TableHead>SUBSCRIPTION STATUS</TableHead>
                <TableHead>JOIN DATE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.subscription === 'Premium'
                            ? 'premium'
                            : user.subscription === 'Pending Payment'
                            ? 'pending'
                            : 'free'
                        }
                      >
                        {user.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.subscription === 'Pending Payment' && (
                          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Verify
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
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
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Showing 1 to 5 of 42 results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">←</Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">...</Button>
          <Button variant="outline" size="sm">→</Button>
        </div>
      </div>
    </div>
  )
}

