import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Link as LinkIcon, 
  Puzzle, 
  Wallet, 
  User,
  Bot
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useSettingsStore from '@/stores/settingsStore'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { toast } from 'react-toastify'

export default function Settings() {
  const { settings, loading, error, fetchSettings, updateSettings } = useSettingsStore();

  // Modal uchun state-lar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    premium_monthly_cost: '',
    receiving_card_number: '',
    cardholder_name: '',
    telegram_admin_username: '',
    support_link: '',
    enable_bot_notifications: true,
    maintenance_mode: false,
    premium_old_price: ''
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({
        premium_monthly_cost: settings.premium_monthly_cost || '',
        receiving_card_number: settings.receiving_card_number || '',
        cardholder_name: settings.cardholder_name || '',
        telegram_admin_username: settings.telegram_admin_username || '',
        support_link: settings.support_link || '',
        enable_bot_notifications: settings.enable_bot_notifications ?? true,
        maintenance_mode: settings.maintenance_mode ?? false,
        premium_old_price: settings.premium_old_price || ''
      });
    }
  }, [settings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Tasdiqlash tugmasi bosilganda ishlaydi
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        ...formData,
        ...(settings?.id && { id: settings.id })
      };
      
      await updateSettings(updates);
      await fetchSettings();
      setIsModalOpen(false); 
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // "Save Changes" tugmasi bosilganda modalni ochadi
  const handleOpenModal = () => {
    setIsModalOpen(true);
  }

  if (loading && (!settings || Object.keys(settings).length === 0)) {
    return (
      <div className="p-8 mx-auto space-y-8 bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 mx-auto space-y-8 bg-background-light min-h-screen">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-medium">
            Manage global configurations and integrations.
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-2">Error: {error}</p>
          )}
        </div>
        <Button 
          onClick={handleOpenModal}
          disabled={loading}
          className="bg-[#3b82f6] hover:bg-blue-600 px-8 py-6 rounded-xl font-bold text-base disabled:opacity-50"
        >
          Save Changes
        </Button>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-slate-800">
            <Wallet className="h-6 w-6 text-blue-500" />
            <h2 className="text-[20px] font-bold">Subscription & Pricing</h2>
          </div>
          
          <Card className="border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] rounded-2xl">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Premium Monthly Cost</label>
                <div className="relative">
                   {/* <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span> */}
                   <Input 
                     value={formData.premium_monthly_cost} 
                     onChange={(e) => handleInputChange('premium_monthly_cost', e.target.value)}
                     className="pl-8 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Premium Old Price</label>
                <div className="relative">
                   {/* <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span> */}
                   <Input 
                     value={formData.premium_old_price} 
                     onChange={(e) => handleInputChange('premium_old_price', e.target.value)}
                     className="pl-8 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Payment Configuration */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-slate-800">
            <CreditCard className="h-6 w-6 text-blue-500" />
            <h2 className="text-[20px] font-bold">Payment Configuration</h2>
          </div>
          
          <Card className="border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] rounded-2xl">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Receiving Card Number (8600...)</label>
                <div className="relative">
                   <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input 
                     value={formData.receiving_card_number} 
                     onChange={(e) => handleInputChange('receiving_card_number', e.target.value)}
                     className="pl-12 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Cardholder Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input 
                     value={formData.cardholder_name} 
                     onChange={(e) => handleInputChange('cardholder_name', e.target.value)}
                     className="pl-12 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Integrations */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-slate-800">
            <Puzzle className="h-6 w-6 text-blue-500" />
            <h2 className="text-[20px] font-bold">Integrations</h2>
          </div>
          
          <Card className="border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Telegram Admin Username</label>
                <div className="relative">
                  <Bot className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    value={formData.telegram_admin_username}
                    onChange={(e) => handleInputChange('telegram_admin_username', e.target.value)}
                    className="px-12 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    type="button"
                  >
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700">Community/Support Link</label>
                <div className="relative">
                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input 
                     value={formData.support_link} 
                     onChange={(e) => handleInputChange('support_link', e.target.value)}
                     className="pl-12 h-12 bg-[#f8fafc] border-none rounded-xl font-medium" 
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Settingsni saqlash"
        message="Haqiqatan ham barcha o'zgarishlarni tizimga saqlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        isLoading={isSaving}
      />
    </div>
  )
}