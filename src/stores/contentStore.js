import { create } from 'zustand'

const useContentStore = create((set, get) => ({
  tests: [],
  users: [],
  loading: false,
  
  fetchTests: async () => {
    set({ loading: true })
    try {
      // In a real app, this would fetch from Supabase
      // For now, using mock data matching the screenshot
      const mockTests = []
      set({ tests: mockTests, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Error fetching tests:', error)
    }
  },
  
  fetchUsers: async () => {
    set({ loading: true })
    try {
      // Mock data matching the screenshot
      const mockUsers = [
        {
          id: '1',
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          avatar: null,
          subscription: 'Premium',
          joinDate: 'Oct 24, 2023',
        },
        {
          id: '2',
          name: 'Ahmed Khan',
          email: 'ahmed.k@example.com',
          avatar: null,
          subscription: 'Pending Payment',
          joinDate: 'Oct 22, 2023',
        },
        {
          id: '3',
          name: 'Li Wei',
          email: 'l.wei@example.com',
          avatar: null,
          subscription: 'Free',
          joinDate: 'Oct 20, 2023',
        },
        {
          id: '4',
          name: 'Michael Johnson',
          email: 'm.johnson@example.com',
          avatar: null,
          subscription: 'Premium',
          joinDate: 'Oct 18, 2023',
        },
        {
          id: '5',
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          avatar: null,
          subscription: 'Free',
          joinDate: 'Oct 15, 2023',
        },
      ]
      set({ users: mockUsers, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Error fetching users:', error)
    }
  },
  
  updateTestStatus: async (testId, status) => {
    const tests = get().tests
    const updatedTests = tests.map(test => 
      test.id === testId ? { ...test, status } : test
    )
    set({ tests: updatedTests })
  },
}))

export default useContentStore

