import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Book, Headphones, Pen, Edit, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useTestStore } from '@/stores/testStore'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '@/components/modals/ConfirmModal'
import Pagination from '@/components/Pagination'
import { format } from 'date-fns'
// O'zingizning modal komponentingizni import qiling


export default function ContentManager() {
  const typeIcons = {
    reading: Book,
    listening: Headphones,
    writing: Pen,
  }
  const navigate = useNavigate();
  const { tests, totalCount, loading, fetchTests, updateTest, deleteTest } = useTestStore();

  // Pagination va Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isLoading: false
  });

  // Track previous values to detect changes
  const prevPageSizeRef = useRef(pageSize);
  const prevCurrentPageRef = useRef(currentPage);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Fetch on initial mount (when site is accessed)
    if (isInitialMount.current) {
      fetchTests(currentPage, pageSize);
      isInitialMount.current = false;
      prevPageSizeRef.current = pageSize;
      prevCurrentPageRef.current = currentPage;
      return;
    }

    // Fetch when pageSize changes
    if (prevPageSizeRef.current !== pageSize) {
      fetchTests(currentPage, pageSize);
      prevPageSizeRef.current = pageSize;
      prevCurrentPageRef.current = currentPage;
      return;
    }

    // Fetch when currentPage changes (through pagination)
    if (prevCurrentPageRef.current !== currentPage) {
      fetchTests(currentPage, pageSize);
      prevCurrentPageRef.current = currentPage;
    }
  }, [currentPage, pageSize, fetchTests]);

  // Pagination logics
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1); // Limit o'zgarganda birinchi betga qaytish
  };

  // Premium toggle
  const handlePremiumToggle = async (testId, currentStatus) => {
    await updateTest(testId, { is_premium: !currentStatus });
  };

  // Delete modal handlers
  const openDeleteModal = (id, title) => {
    setDeleteModal({ isOpen: true, id, title, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    await deleteTest(deleteModal.id);
    setDeleteModal({ isOpen: false, id: null, title: '', isLoading: false });
    // Agar oxirgi element o'chsa va sahifa bo'sh qolsa, oldingi sahifaga o'tish
    if (tests.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Filter tests based on search term and type
  const filteredTests = tests.filter(test => {
    const matchesSearch = 
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toString().includes(searchTerm);
    
    const matchesType = !typeFilter || test.type?.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const formattedDate = (date) => {
    const simpleDate = format(new Date(date), "MMM dd, yyyy HH:mm");

    return simpleDate;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="text-sm text-gray-500">Home {'>'} Content Manager</div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Practice Content</h1>
          <p className="text-sm text-gray-500">Manage your tests and educational materials.</p>
        </div>
        <Button onClick={() => navigate('/content/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Test
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="shadow-sm border-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tests..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="shadow-sm border-none overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[20%]">TEST TITLE</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>DIFFICULTY</TableHead>
              <TableHead>QUESTIONS</TableHead>
              <TableHead>PREMIUM</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400">Loading data...</TableCell></TableRow>
            ) : filteredTests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400">No tests found.</TableCell></TableRow>
            ) : (
              filteredTests.map((test) => {
                const Icon = typeIcons[test.type?.toLowerCase()] || Book;
                return (
                  <TableRow key={test.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">
                       <div>{test.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] text-gray-400 font-normal">{formattedDate(test.created_at)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-500" />
                        <span className="capitalize text-sm">{test.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">{test.difficulty}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">{test.question_quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={test.is_premium} 
                        onCheckedChange={() => handlePremiumToggle(test.id, test.is_premium)} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/content/edit/${test.id}`)}>
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(test.id, test.title)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        handlePageChange={handlePageChange}
        handleLimitChange={handleLimitChange}
        title="tests"
        loading={loading}
      />
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Testni o'chirish"
        message={`"${deleteModal.title}" testini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        isLoading={deleteModal.isLoading}
        variant="danger"
      />
    </div>
  )
}