import { create } from "zustand";
import supabase from "@/lib/supabase";
import { toast } from "react-toastify";

const userStore = create((set, get) => ({
  users: [],
  loading: false,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  searchQuery: "",
  statusFilter: "All",

  fetchUsers: async (page = 1, limit = 10, search = "", status = "All") => {
    set({
      loading: true,
      currentPage: page,
      pageSize: limit,
      searchQuery: search,
      statusFilter: status,
    });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("users").select("*", { count: "exact" });

    // 1. Search mantiqi (Name yoki Email bo'yicha)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 2. Status bo'yicha filtr
    if (status !== "All") {
      query = query.eq("subscription_status", status);
    }

    // 3. Tartiblash va Range
    const { data, count, error } = await query
      .order("joined_at", { ascending: false })
      .range(from, to);

    if (!error) {
      set({ users: data, totalCount: count || 0, loading: false });
    } else {
      console.error("Fetch error:", error);
      set({ loading: false });
    }
  },
  getUserById: async (id) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  },

  uploadAvatar: async (file, userId = null) => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = userId 
        ? `${userId}_${Date.now()}.${fileExt}`
        : `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars_image')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Rasm yuklashda xatolik yuz berdi');
        return { error: uploadError, url: null };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars_image')
        .getPublicUrl(filePath);

      return { error: null, url: publicUrl };
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Rasm yuklashda xatolik yuz berdi');
      return { error, url: null };
    }
  },

  updateUser: async (id, updateData) => {
    set({ loading: true });
    
    try {
      // If there's a new avatar file, upload it first
      let avatarUrl = updateData.avatar_image;
      if (updateData.avatar_file) {
        const uploadResult = await get().uploadAvatar(updateData.avatar_file, id);
        if (uploadResult.error) {
          set({ loading: false });
          return { success: false, error: uploadResult.error };
        }
        avatarUrl = uploadResult.url;
      }

      // Remove avatar_file from updateData before sending to database
      const { avatar_file, ...dataToUpdate } = updateData;
      
      // Update with the avatar URL if we have one
      const finalUpdateData = avatarUrl 
        ? { ...dataToUpdate, avatar_image: avatarUrl }
        : dataToUpdate;

      const { error } = await supabase
        .from("users")
        .update(finalUpdateData)
        .eq("id", id);

      if (error) {
        toast.error('Foydalanuvchini yangilashda xatolik yuz berdi');
        set({ loading: false });
        return { success: false, error };
      }

      toast.success('Foydalanuvchi muvaffaqiyatli yangilandi!');
      set({ loading: false });
      return { success: true, error: null };
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Foydalanuvchini yangilashda xatolik yuz berdi');
      set({ loading: false });
      return { success: false, error };
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error('Foydalanuvchini o\'chirishda xatolik yuz berdi');
        set({ loading: false });
        return { success: false, error };
      }

      toast.success('Foydalanuvchi muvaffaqiyatli o\'chirildi!');
      
      // Refresh the users list
      const { currentPage, pageSize, searchQuery, statusFilter } = get();
      await get().fetchUsers(currentPage, pageSize, searchQuery, statusFilter);
      
      set({ loading: false });
      return { success: true, error: null };
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Foydalanuvchini o\'chirishda xatolik yuz berdi');
      set({ loading: false });
      return { success: false, error };
    }
  },

 
}));

export default userStore;
