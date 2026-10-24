import React from 'react';
import { Sparkles, Sun, Moon, Bell, BellRing, Settings } from 'lucide-react';
import { UserPlan, UserPreferences } from '../types/reminder';

interface HeaderProps {
  currentTab: 'reminders' | 'calendar' | 'subscriptions' | 'categories';
  onSelectTab: (tab: 'reminders' | 'calendar' | 'subscriptions' | 'categories') => void;
  userPlan: UserPlan;
  preferences: UserPreferences;
  onOpenPremium: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onRequestNotifications: () => void;
  notificationPermissionGranted: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userPlan,
  preferences,
  onOpenPremium,
  onOpenSettings,
  onToggleTheme,
  onRequestNotifications,
  notificationPermissionGranted,
}) => {
  const isPremium = userPlan.tier === 'PREMIUM';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('reminders')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              V
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-none">
                Vocalis
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                Reminders
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onSelectTab('reminders')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white py-1 ${
              currentTab === 'reminders'
                ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400'
                : ''
            }`}
          >
            Reminders
          </button>
          <button
            onClick={() => onSelectTab('calendar')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white py-1 ${
              currentTab === 'calendar'
                ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400'
                : ''
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => onSelectTab('subscriptions')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white py-1 ${
              currentTab === 'subscriptions'
                ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400'
                : ''
            }`}
          >
            Subscriptions &amp; Trials
          </button>
          <button
            onClick={() => onSelectTab('categories')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white py-1 ${
              currentTab === 'categories'
                ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400'
                : ''
            }`}
          >
            Categories
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!notificationPermissionGranted && (
            <button
              onClick={onRequestNotifications}
              title="Enable notifications"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4 text-amber-500" />
            </button>
          )}

          <button
            onClick={onToggleTheme}
            title={preferences.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {preferences.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings &amp; Info"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isPremium ? (
            <button
              onClick={onOpenPremium}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 whitespace-nowrap hover:bg-teal-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Premium Active</span>
            </button>
          ) : (
            <button
              onClick={onOpenPremium}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Premium</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
