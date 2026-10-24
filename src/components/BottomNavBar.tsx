import React from 'react';
import { Calendar, CheckSquare, Repeat, Tag, Plus } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'reminders' | 'calendar' | 'subscriptions' | 'categories';
  onSelectTab: (tab: 'reminders' | 'calendar' | 'subscriptions' | 'categories') => void;
  onOpenCreateModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-4 items-center h-16 max-w-lg mx-auto px-2">
        <button
          type="button"
          onClick={() => onSelectTab('reminders')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'reminders'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Reminders</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'calendar'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('subscriptions')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'subscriptions'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Subscriptions</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'categories'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Categories</span>
        </button>
      </div>
    </nav>
  );
};
