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


export default function ContentManager() {
  const typeIcons = {
    reading: Book,
    listening: Headphones,
    writing: Pen,
  }
  const navigate = useNavigate();
  const { 
    tests, 
    totalCount, 
    loading, 
    fetchTests, 
    updateTest, 
    deleteTest, 
    searchQuery, 
    typeFilter,
    setSearchQuery,
    setTypeFilter
  } = useTestStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isLoading: false
  });

  const searchDebounceTimer = useRef(null);
  const prevPageSizeRef = useRef(pageSize);
  const prevCurrentPageRef = useRef(currentPage);
  const prevSearchQueryRef = useRef(searchQuery);
  const prevTypeFilterRef = useRef(typeFilter);
  const isInitialMount = useRef(true);

  // Sync local search query with store on mount
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isInitialMount.current) {
      fetchTests(currentPage, pageSize, searchQuery, typeFilter);
      isInitialMount.current = false;
      prevPageSizeRef.current = pageSize;
      prevCurrentPageRef.current = currentPage;
      prevSearchQueryRef.current = searchQuery;
      prevTypeFilterRef.current = typeFilter;
      return;
    }
  }, []);

  // Handle search/filter/pagination changes
  useEffect(() => {
    if (isInitialMount.current) return;

    const hasSearchChanged = prevSearchQueryRef.current !== searchQuery;
    const hasTypeFilterChanged = prevTypeFilterRef.current !== typeFilter;
    const hasPageSizeChanged = prevPageSizeRef.current !== pageSize;
    const hasCurrentPageChanged = prevCurrentPageRef.current !== currentPage;

    if (hasSearchChanged || hasTypeFilterChanged || hasPageSizeChanged || hasCurrentPageChanged) {
      // Reset to page 1 when search or filter changes
      if ((hasSearchChanged || hasTypeFilterChanged) && currentPage !== 1) {
        setCurrentPage(1);
        prevCurrentPageRef.current = 1;
        fetchTests(1, pageSize, searchQuery, typeFilter);
      } else {
        fetchTests(currentPage, pageSize, searchQuery, typeFilter);
      }

      prevPageSizeRef.current = pageSize;
      prevCurrentPageRef.current = currentPage;
      prevSearchQueryRef.current = searchQuery;
      prevTypeFilterRef.current = typeFilter;
    }
  }, [currentPage, pageSize, searchQuery, typeFilter, fetchTests]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handlePremiumToggle = async (testId, currentStatus) => {
    await updateTest(testId, { is_premium: !currentStatus });
  };

  const openDeleteModal = (id, title) => {
    setDeleteModal({ isOpen: true, id, title, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    await deleteTest(deleteModal.id);
    setDeleteModal({ isOpen: false, id: null, title: '', isLoading: false });
    if (tests.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);

    // Clear existing timer
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    // Set new timer for debounced search
    searchDebounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
    }, 500); // 500ms debounce
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
  };

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

      <Card className="shadow-sm border-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tests..."
                className="pl-10"
                value={localSearchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <select 
              value={typeFilter}
              onChange={handleFilterChange}
              className="h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
          </select>
        </div>
      </CardContent>
    </Card>
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
              <TableRow><TableCell colSpan={7} className="text-center py-20 text-gray-400">Loading data...</TableCell></TableRow>
            ) : tests.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-20 text-gray-400">No tests found.</TableCell></TableRow>
            ) : (
              tests.map((test) => {
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