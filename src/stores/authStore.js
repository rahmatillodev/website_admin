import supabase from "@/lib/supabase";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      session: null,
      _initialized: false,

      signIn: async (email, password) => {
        try {
          set({ loading: true });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ loading: false });
            return { success: false, error: error.message };
          }

          // Set user and session
          set({ 
            user: data.user, 
            session: data.session,
            loading: false 
          });
          
          return { success: true, session: data.session };
        } catch (error) {
          set({ loading: false });
          return { success: false, error: error.message || "An unexpected error occurred" };
        }
      },

      signOut: async () => {
        try {
          set({ loading: true });
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error("Sign out error:", error);
          }
          
          set({ user: null, session: null, loading: false });
        } catch (error) {
          console.error("Sign out error:", error);
          set({ user: null, session: null, loading: false });
        }
      },

      checkSession: async () => {
        try {
          set({ loading: true });
          
          // Get current session from Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session check error:", error);
            set({ user: null, session: null, loading: false });
            return;
          }

          if (session?.user) {
            set({ 
              user: session.user, 
              session: session,
              loading: false 
            });
          } else {
            set({ user: null, session: null, loading: false });
          }
        } catch (error) {
          console.error("Session check error:", error);
          set({ user: null, session: null, loading: false });
        }
      },

      initializeAuth: () => {
        // Only set up listener once
        if (get()._initialized) {
          return;
        }

        set({ _initialized: true });

        // Set up auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            set({ 
              user: session?.user || null, 
              session: session,
              loading: false 
            });
          } else if (event === "SIGNED_OUT") {
            set({ user: null, session: null, loading: false });
          }
        });

        // Initial session check
        get().checkSession();
      },

      fetchUserRole: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          return null;
        }

        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (error || !data) {
            return null;
          }
          return data.role;
        } catch (error) {
          console.error("Error fetching user role:", error);
          return null;
        }
      },
    }),
    {
      name: "auth-store", // localStorage key nomi
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }), // faqat user-ni saqlaymiz
    }
  )
);

export default useAuthStore;
