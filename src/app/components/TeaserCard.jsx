import React from 'react';
import { Sparkles } from 'lucide-react';

export function TeaserCard({ message }) {
  return (
    <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/50 to-amber-50/95 dark:from-amber-950/30 dark:via-gray-900 dark:to-amber-950/20 border-2 border-orange-600 dark:border-amber-500/90 rounded-2xl p-3.5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 my-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-xl flex items-center justify-center shadow-sm border border-orange-400/30">
            <Sparkles size={18} />
          </div>
        </div>
        <div className="flex-1">
          <div 
            className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed font-medium" 
            dangerouslySetInnerHTML={{ __html: message }} 
          />
        </div>
      </div>
    </div>
  );
}
