import { useEffect } from 'react'
import { Plus, Search, Book, Headphones, Pen, Edit, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import useContentStore from '@/stores/contentStore'

const typeIcons = {
  Reading: Book,
  Listening: Headphones,
  Writing: Pen,
}

export default function ContentManager() {
  const { tests, loading, fetchTests, updateTestStatus } = useContentStore()

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const handleStatusToggle = (testId, currentStatus) => {
    const newStatus = currentStatus === 'Premium' ? 'Free' : 'Premium'
    updateTestStatus(testId, newStatus)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500">
        Home {'>'} Content Manager {'>'} Practice Tests
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Practice Content Manager</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage reading and listening tests, difficulty levels, and premium status.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Test
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by test title or ID.."
                className="pl-10"
              />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Type: All</option>
              <option>Reading</option>
              <option>Listening</option>
              <option>Writing</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Status: All</option>
              <option>Premium</option>
              <option>Free</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Difficulty: All</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TEST TITLE</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>DIFFICULTY</TableHead>
                <TableHead>COMPLETIONS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => {
                  const TypeIcon = typeIcons[test.type] || Book
                  return (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell className="text-gray-500">#{test.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${
                            test.type === 'Reading' ? 'text-purple-600' : 
                            test.type === 'Listening' ? 'text-blue-600' : 
                            'text-purple-600'
                          }`} />
                          <span>{test.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={test.difficulty.toLowerCase()}>
                          {test.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{test.completions.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={test.status === 'Premium'}
                            onCheckedChange={() => handleStatusToggle(test.id, test.status)}
                          />
                          <span className="text-sm text-gray-600">{test.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Showing 1-5 of 48 results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  )
}

