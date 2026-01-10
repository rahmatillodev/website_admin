import supabase from '@/lib/supabase'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,

      signIn: async (email, password) => {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("password", password)
          .single()

        if (error || !data) {
          return { success: false, error: "Email yoki parol noto'g'ri" }
        }

        if (data.role !== "admin") {
          return { success: false, error: "Siz admin emassiz" }
        }

        set({ user: data }) // state'ni o'zgartiramiz
        return { success: true, user: data }
      },

      signOut: () => {
        set({ user: null })
      },

      checkSession: () => {},

      fetchUserRole: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          return null;
        }

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.id)
          .single()

        if (error || !data) {
          return null;
        }
        return data.role;
      }
    }),
    {
      name: "auth-store", // localStorage key nomi
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user
      }), // faqat user-ni saqlaymiz
    }
  )
)

export default useAuthStore
