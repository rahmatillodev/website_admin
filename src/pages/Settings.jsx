import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Link as LinkIcon, 
  Puzzle, 
  Wallet, 
  User,
  Bot,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSettingsStore from '@/stores/settingsStore';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { toast } from 'react-toastify';

export default function Settings() {
  const { settings, loading, error, fetchSettings, updateSettings } = useSettingsStore();

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        ...formData,
        ...(settings?.id && { id: settings.id })
      };
      
      await updateSettings(updates);
      toast.success('Sozlamalar muvaffaqiyatli saqlandi');
      setIsModalOpen(false); 
    } catch (err) {
      toast.error('Saqlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && (!settings || Object.keys(settings).length === 0)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Tizimning umumiy konfiguratsiyasi va integratsiyalarini boshqaring.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={loading || isSaving}
          className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-blue-200"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Saqlash
        </Button>
      </div>

      <div className="grid gap-8">
        {/* 1. Pricing Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg px-1">
            <Wallet className="h-5 w-5 text-blue-500" />
            Subscription & Pricing
          </div>
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Premium Monthly Cost</label>
                <Input 
                  placeholder="Masalan: 50,000"
                  value={formData.premium_monthly_cost} 
                  onChange={(e) => handleInputChange('premium_monthly_cost', e.target.value)}
                  className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Premium Old Price</label>
                <Input 
                  placeholder="Masalan: 80,000"
                  value={formData.premium_old_price} 
                  onChange={(e) => handleInputChange('premium_old_price', e.target.value)}
                  className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Payment Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg px-1">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Payment Configuration
          </div>
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Karta raqami (8600...)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    value={formData.receiving_card_number} 
                    onChange={(e) => handleInputChange('receiving_card_number', e.target.value)}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Karta egasi ismi</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    value={formData.cardholder_name} 
                    onChange={(e) => handleInputChange('cardholder_name', e.target.value)}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Integrations Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg px-1">
            <Puzzle className="h-5 w-5 text-blue-500" />
            Integrations
          </div>
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
            <CardContent className="p-6 grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Telegram Admin Username</label>
                <div className="relative">
                  <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="@admin_username"
                    value={formData.telegram_admin_username}
                    onChange={(e) => handleInputChange('telegram_admin_username', e.target.value)}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Support Link (Guruh yoki Bot)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="https://t.me/..."
                    value={formData.support_link} 
                    onChange={(e) => handleInputChange('support_link', e.target.value)}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white" 
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
        title="O'zgarishlarni saqlash"
        message="Haqiqatan ham ushbu sozlamalarni yangilamoqchimisiz?"
        isLoading={isSaving}
      />
    </div>
  );
}