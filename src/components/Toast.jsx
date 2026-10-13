import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-300/90 bg-gradient-to-b from-white via-emerald-50/95 to-emerald-100/90 text-emerald-950 shadow-[0_20px_42px_-8px_rgba(16,185,129,0.28),inset_0_2px_2px_rgba(255,255,255,1)]',
    error: 'border-rose-300/90 bg-gradient-to-b from-white via-rose-50/95 to-rose-100/90 text-rose-950 shadow-[0_20px_42px_-8px_rgba(244,63,94,0.28),inset_0_2px_2px_rgba(255,255,255,1)]',
    info: 'border-sky-300/90 bg-gradient-to-b from-white via-sky-50/95 to-sky-100/90 text-sky-950 shadow-[0_20px_42px_-8px_rgba(2,132,199,0.28),inset_0_2px_2px_rgba(255,255,255,1)]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-bounce-short">
      <div className={`flex items-start gap-3 p-4 rounded-2xl border-[1.5px] backdrop-blur-2xl ${borderColors[toast.type || 'success']}`}>
        {icons[toast.type || 'success']}
        <div className="flex-1 text-sm font-bold pr-2">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-white/80 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
