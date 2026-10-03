import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  itemDetails?: string;
  message?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'ریکارڈ حذف کرنے کی تصدیق',
  itemName,
  itemDetails,
  message,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-naskh">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-red-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-bold font-nastaliq">{title}</h3>
              <p className="text-[11px] text-red-100">کیا آپ اس ریکارڈ کو مستقل طور پر خارج کرنا چاہتے ہیں؟</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {itemName && (
            <div className="bg-red-50 border border-red-200/80 rounded-xl p-3.5">
              <p className="text-xs text-red-700 font-semibold mb-1">منتخب کردہ ریکارڈ:</p>
              <p className="text-base font-bold text-slate-800 font-nastaliq">{itemName}</p>
              {itemDetails && (
                <p className="text-xs text-slate-600 mt-1">{itemDetails}</p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            {message || 'یہ عمل واپس نہیں لیا جا سکتا۔ حذف کرنے کی صورت میں یہ ریکارڈ مستقل طور پر ڈیٹا بیس سے خارج کر دیا جائے گا۔'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              منسوخ کریں (Cancel)
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isLoading ? 'حذف ہو رہا ہے...' : 'ہاں، مستقل حذف کریں'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
