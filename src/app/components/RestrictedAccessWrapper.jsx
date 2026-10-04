import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { NavigationFooter } from './NavigationFooter';

export function RestrictedAccessWrapper({ children, title }) {
  const { goBack, darkMode } = useAppContext();
  return (
    <div className={`min-h-screen font-sans flex justify-center overflow-x-hidden transition-colors duration-500 ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen shadow-xl flex flex-col relative overflow-x-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 text-gray-900 dark:text-white sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
          <button onClick={goBack} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors bg-gray-50 dark:bg-gray-800" title="Back"><ArrowLeft size={20} /></button>
          <h2 className="font-bold text-xl">{title}</h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto pb-20 max-w-full overflow-x-hidden animate-slide-in">{children}</div>
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto p-1.5 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <NavigationFooter />
        </div>
      </div>
    </div>
  );
}
