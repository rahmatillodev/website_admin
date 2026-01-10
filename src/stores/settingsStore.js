import { create } from 'zustand';
import supabase from '@/lib/supabase';

const useSettingsStore = create((set, get) => ({
  settings: {},
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      
      set({ settings: data || {}, loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSettings: async (updates) => {
    set({ loading: true, error: null });
    try {
      // First check if settings exist
      const currentSettings = get().settings;
      
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      
      set({ settings: data, loading: false });
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));

export default useSettingsStore;