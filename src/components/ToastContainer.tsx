import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export function ToastContainer() {
  const { toasts, dismissToast } = usePortal();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-md bg-white ${
            t.tone === 'success'
              ? 'border-emerald-200 text-emerald-900'
              : t.tone === 'error'
                ? 'border-red-200 text-red-900'
                : 'border-slate-200 text-slate-900'
          }`}
        >
          {t.tone === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {t.tone === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
          {t.tone === 'info' && <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />}
          <p className="text-xs font-medium flex-1">{t.text}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
