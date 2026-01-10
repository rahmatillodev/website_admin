import React from 'react';
import { Button } from '@/components/ui/button';

 function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-slate-500">{message}</p>
        </div>
        
        <div className="flex gap-3 justify-end mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-6"
            disabled={isLoading}
          >
            Bekor qilish
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
            disabled={isLoading}
          >
            {isLoading ? "Saqlanmoqda..." : "Tasdiqlash"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;