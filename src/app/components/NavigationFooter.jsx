import React from 'react';
import { Home, BookOpen, Layout, PieChart, User, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function NavigationFooter() {
  const { currentScreen, setCurrentScreen } = useAppContext();

  const navItems = [
    { id: 'welcome', label: 'Home', icon: Home },
    { id: 'app', label: 'Questions', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Layout },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <nav className="w-full max-w-full overflow-hidden grid grid-cols-6 gap-0.5 items-center justify-between text-center">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.25 px-0.5 rounded-lg w-full max-w-full overflow-hidden transition-all duration-200 ${isActive
              ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium'
              }`}
          >
            <Icon size={20} className={`shrink-0 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] sm:text-[12px] leading-tight truncate w-full tracking-tighter">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
