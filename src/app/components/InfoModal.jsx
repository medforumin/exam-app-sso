import React from 'react';
import { Info, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function InfoModal() {
  const { isInfoModalOpen, closeInfoModal, infoPopupContent } = useAppContext();

  if (!isInfoModalOpen || !infoPopupContent) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
      onClick={closeInfoModal}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 relative flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button top-right */}
        <button
          onClick={closeInfoModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-6">
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-200/60 dark:border-teal-800/60 shrink-0">
            <Info size={18} />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Important Notice</h4>
          </div>
        </div>

        {/* HTML Content Body */}
        <div className="flex-1 overflow-y-auto mb-5 pr-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <div
            className="prose prose-sm prose-teal dark:prose-invert max-w-none text-sm space-y-2"
            dangerouslySetInnerHTML={{ __html: infoPopupContent }}
          />
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-end pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <button
            onClick={closeInfoModal}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white py-2.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
