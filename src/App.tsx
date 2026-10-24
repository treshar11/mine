import React, { useState, useEffect } from 'react';
import {
  Header
} from './components/Header';
import {
  HomeQuickEntry
} from './components/HomeQuickEntry';
import {
  ReminderList
} from './components/ReminderList';
import {
  CalendarView
} from './components/CalendarView';
import {
  SubscriptionTracker
} from './components/SubscriptionTracker';
import {
  CategoryManager
} from './components/CategoryManager';
import {
  PremiumModal
} from './components/PremiumModal';
import {
  ReminderModal
} from './components/ReminderModal';
import {
  SettingsModal
} from './components/SettingsModal';
import {
  EmailViewerModal
} from './components/EmailViewerModal';
import {
  ActiveAlertBanner
} from './components/ActiveAlertBanner';
import {
  BottomNavBar
} from './components/BottomNavBar';
import {
  Category,
  CategoryId,
  Reminder,
  UserPlan,
  UserPreferences,
  SentEmail,
  NotificationTone
} from './types/reminder';
import {
  STANDARD_CATEGORIES,
  loadReminders,
  saveReminders,
  loadCustomCategories,
  saveCustomCategories,
  loadUserPlan,
  saveUserPlan,
  loadUserPreferences,
  saveUserPreferences,
  loadSentEmails,
  saveSentEmail
} from './utils/storage';
import {
  checkUpcomingReminders,
  requestNotificationPermission,
  subscribeToAlerts,
  triggerReminderAlert,
  ActiveAlert
} from './utils/notifications';
import { playNotificationTone } from './utils/audio';
import { computeNextRecurrenceDate } from './utils/nlpParser';
import { Sparkles, Calendar, Tag, Plus, CheckCircle, Bell } from 'lucide-react';

export default function App() {
  // 1. Persistent Storage State
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders());
  const [customCategories, setCustomCategories] = useState<Category[]>(() => loadCustomCategories());
  const [userPlan, setUserPlan] = useState<UserPlan>(() => loadUserPlan());
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const [sentEmails, setSentEmails] = useState<SentEmail[]>(() => loadSentEmails());

  // 2. Navigation & View State
  const [currentTab, setCurrentTab] = useState<'reminders' | 'calendar' | 'subscriptions' | 'categories'>('reminders');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');

  // 3. Modals State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [dateForNewReminder, setDateForNewReminder] = useState<string | undefined>(undefined);
  const [timeForNewReminder, setTimeForNewReminder] = useState<string | undefined>(undefined);
  const [viewingEmail, setViewingEmail] = useState<SentEmail | null>(null);

  // 4. Alerts & Notifications
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  // Sync state to storage
  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    saveCustomCategories(customCategories);
  }, [customCategories]);

  useEffect(() => {
    saveUserPlan(userPlan);
  }, [userPlan]);

  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences]);

  // Combined categories list (Standard + Custom)
  const allCategories: Category[] = [...STANDARD_CATEGORIES, ...customCategories];
  const isPremium = userPlan.tier === 'PREMIUM';

  // Theme synchronization
  useEffect(() => {
    const isDark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Notification Permissions Check
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      playNotificationTone(preferences.defaultTone);
    }
  };

  // Subscribe to Alert Triggers
  useEffect(() => {
    const unsubscribe = subscribeToAlerts((alert) => {
      setActiveAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    });
    return () => unsubscribe();
  }, []);

  // Interval Scheduler checking upcoming reminders every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkUpcomingReminders(reminders, preferences.categoryTones);
    }, 5000);
    return () => clearInterval(interval);
  }, [reminders, preferences.categoryTones]);

  // Handlers for Reminders
  const handleSaveReminder = (
    reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const nowIso = new Date().toISOString();

    if (existingId) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === existingId
            ? {
                ...r,
                ...reminderData,
                updatedAt: nowIso,
              }
            : r
        )
      );
    } else {
      const newReminder: Reminder = {
        id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...reminderData,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setReminders((prev) => [newReminder, ...prev]);
    }
  };

  const handleToggleComplete = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    const willBeCompleted = !target.isCompleted;

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            isCompleted: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // If completing a recurring task, schedule the next iteration!
    if (willBeCompleted && target.recurrence !== 'none') {
      const nextDate = computeNextRecurrenceDate(target.date, target.recurrence);
      const nextReminder: Reminder = {
        id: `rem_${Date.now()}_next`,
        title: target.title,
        notes: target.notes,
        date: nextDate,
        time: target.time,
        categoryId: target.categoryId,
        isCompleted: false,
        recurrence: target.recurrence,
        advanceAlerts: target.advanceAlerts,
        customTone: target.customTone,
        isSubscription: target.isSubscription,
        subscriptionMeta: target.subscriptionMeta,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setReminders((prev) => [nextReminder, ...prev]);
    }
  };

  const handleDeleteReminder = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (target?.isTestReminder) {
      setPreferences((prev) => ({ ...prev, testReminderDeleted: true }));
    }
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllCompleted = () => {
    setReminders((prev) => prev.filter((r) => !r.isCompleted));
  };

  const handleSnoozeReminder = (id: string, minutes: number) => {
    const snoozeTime = new Date(Date.now() + minutes * 60000).toISOString();
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, snoozedUntil: snoozeTime } : r))
    );
  };

  const handleMarkSubscriptionCancelled = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            subscriptionMeta: {
              ...r.subscriptionMeta,
              isCancelled: true,
              cancelledAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  // Custom Categories Handlers
  const handleSaveCustomCategory = (category: Category) => {
    setCustomCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      if (exists) {
        return prev.map((c) => (c.id === category.id ? category : c));
      }
      return [...prev, category];
    });
  };

  const handleDeleteCustomCategory = (categoryId: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.id !== categoryId));
    // Reassign reminders of this category to null or 'other'
    setReminders((prev) =>
      prev.map((r) => (r.categoryId === categoryId ? { ...r, categoryId: 'other' } : r))
    );
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }
  };

  // Premium Activation Handler
  const handlePlanActivated = (newPlan: UserPlan, email?: SentEmail) => {
    setUserPlan(newPlan);
    if (email) {
      saveSentEmail(email);
      setSentEmails((prev) => [email, ...prev.filter((e) => e.id !== email.id)]);
    }
  };

  const handleCancelSubscription = () => {
    setUserPlan((prev) => ({
      ...prev,
      autoRenew: false,
    }));
  };

  // Test Notification Handler (Section 12)
  const handleTestNotification = () => {
    const testRem: Reminder = {
      id: `test_${Date.now()}`,
      title: 'Acoustic Alert & Notification Test',
      notes: 'Testing tone synthesis, device vibration, and in-app alert banner.',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      categoryId: 'other',
      isCompleted: false,
      recurrence: 'none',
      advanceAlerts: [0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    triggerReminderAlert(testRem, 'due', 0, preferences.defaultTone);
  };

  const handleOpenCreateOnDate = (date: string, time?: string) => {
    setEditingReminder(null);
    setDateForNewReminder(date);
    setTimeForNewReminder(time || '09:00');
    setIsReminderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 md:pb-8">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userPlan={userPlan}
        preferences={preferences}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleTheme={() =>
          setPreferences((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        onRequestNotifications={handleRequestNotificationPermission}
        notificationPermissionGranted={notificationPermissionGranted}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* TAB 1: REMINDERS (Home Screen) */}
        {currentTab === 'reminders' && (
          <div className="space-y-6">
            {/* Home Screen Voice and Manual Entry Component */}
            <HomeQuickEntry
              categories={allCategories}
              isPremium={isPremium}
              onSaveReminder={handleSaveReminder}
              onOpenUpgradeForCategory={() => setIsPremiumModalOpen(true)}
            />

            {/* Upcoming Reminders Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Upcoming Reminders
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Appointments, bills, tasks, and scheduled dates
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingReminder(null);
                    setDateForNewReminder(undefined);
                    setTimeForNewReminder(undefined);
                    setIsReminderModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Reminder</span>
                </button>
              </div>

              {/* Reminders List View */}
              <ReminderList
                reminders={reminders}
                categories={allCategories}
                userPlan={userPlan}
                showCompleted={preferences.showCompletedReminders}
                selectedCategory={selectedCategory}
                onToggleComplete={handleToggleComplete}
                onDeleteReminder={handleDeleteReminder}
                onClearAllCompleted={handleClearAllCompleted}
                onToggleShowCompleted={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    showCompletedReminders: !prev.showCompletedReminders,
                  }))
                }
                onEditReminder={(r) => {
                  setEditingReminder(r);
                  setIsReminderModalOpen(true);
                }}
                onSnoozeReminder={handleSnoozeReminder}
                onOpenPremium={() => setIsPremiumModalOpen(true)}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR VIEW */}
        {currentTab === 'calendar' && (
          <CalendarView
            reminders={reminders}
            categories={allCategories}
            userPlan={userPlan}
            showCompleted={preferences.showCompletedReminders}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onToggleComplete={handleToggleComplete}
            onDeleteReminder={handleDeleteReminder}
            onEditReminder={(r) => {
              setEditingReminder(r);
              setIsReminderModalOpen(true);
            }}
            onAddReminderOnDate={handleOpenCreateOnDate}
          />
        )}

        {/* TAB 3: SUBSCRIPTIONS & FREE TRIALS */}
        {currentTab === 'subscriptions' && (
          <SubscriptionTracker
            reminders={reminders}
            userPlan={userPlan}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
            onAddSubscriptionReminder={() => {
              setEditingReminder(null);
              setDateForNewReminder(undefined);
              setTimeForNewReminder('09:00');
              setIsReminderModalOpen(true);
            }}
            onEditReminder={(r) => {
              setEditingReminder(r);
              setIsReminderModalOpen(true);
            }}
            onMarkSubscriptionCancelled={handleMarkSubscriptionCancelled}
            onDeleteReminder={handleDeleteReminder}
          />
        )}

        {/* TAB 4: CATEGORIES */}
        {currentTab === 'categories' && (
          <CategoryManager
            categories={allCategories}
            reminders={reminders}
            userPlan={userPlan}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
            onSaveCustomCategory={handleSaveCustomCategory}
            onDeleteCustomCategory={handleDeleteCustomCategory}
            onSelectCategoryFilter={(catId) => {
              setSelectedCategory(catId);
              setCurrentTab('reminders');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateModal={() => {
          setEditingReminder(null);
          setIsReminderModalOpen(true);
        }}
      />

      {/* In-App Active Reminder Alerts Banner */}
      <ActiveAlertBanner
        alerts={activeAlerts}
        onDismiss={(alertId) =>
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
        }
        onComplete={(reminderId, alertId) => {
          handleToggleComplete(reminderId);
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
        }}
        onSnooze={(reminderId, alertId, minutes) => {
          handleSnoozeReminder(reminderId, minutes);
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
        }}
      />

      {/* Premium Upgrade Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        userPlan={userPlan}
        onPlanActivated={handlePlanActivated}
        onViewEmail={(email) => setViewingEmail(email)}
      />

      {/* Detailed Reminder Create / Edit Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        reminder={editingReminder}
        initialDate={dateForNewReminder}
        initialTime={timeForNewReminder}
        categories={allCategories}
        userPlan={userPlan}
        onSave={handleSaveReminder}
        onOpenPremium={() => {
          setIsReminderModalOpen(false);
          setIsPremiumModalOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userPlan={userPlan}
        preferences={preferences}
        reminders={reminders}
        sentEmails={sentEmails}
        notificationPermissionGranted={notificationPermissionGranted}
        onRequestNotifications={handleRequestNotificationPermission}
        onTestNotification={handleTestNotification}
        onUpdatePreferences={(updated) =>
          setPreferences((prev) => ({ ...prev, ...updated }))
        }
        onCancelSubscription={handleCancelSubscription}
        onOpenPremium={() => {
          setIsSettingsModalOpen(false);
          setIsPremiumModalOpen(true);
        }}
        onOpenEmailViewer={() => {
          if (sentEmails.length > 0) {
            setViewingEmail(sentEmails[0]);
          }
        }}
        onClearAllData={() => {
          setReminders([]);
          setCustomCategories([]);
          saveReminders([]);
          saveCustomCategories([]);
        }}
      />

      {/* Transactional Email Viewer Modal */}
      <EmailViewerModal
        email={viewingEmail}
        onClose={() => setViewingEmail(null)}
      />
    </div>
  );
}
