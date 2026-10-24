import React, { useState } from 'react';
import {
  Check,
  Undo2,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  Repeat,
  Sparkles,
  MoreVertical,
  BellRing,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Search,
  Tag,
  CreditCard,
  Edit2
} from 'lucide-react';
import { Reminder, Category, CategoryId, UserPlan } from '../types/reminder';

interface ReminderListProps {
  reminders: Reminder[];
  categories: Category[];
  userPlan: UserPlan;
  showCompleted: boolean;
  selectedCategory: CategoryId | 'all';
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onClearAllCompleted: () => void;
  onToggleShowCompleted: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onSnoozeReminder: (id: string, minutes: number) => void;
  onOpenPremium: () => void;
  onSelectCategory: (catId: CategoryId | 'all') => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  categories,
  userPlan,
  showCompleted,
  selectedCategory,
  onToggleComplete,
  onDeleteReminder,
  onClearAllCompleted,
  onToggleShowCompleted,
  onEditReminder,
  onSnoozeReminder,
  onOpenPremium,
  onSelectCategory,
}) => {
  const isPremium = userPlan.tier === 'PREMIUM';
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearCompletedConfirm, setClearCompletedConfirm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getCategory = (catId?: string | null): Category | undefined => {
    if (!catId) return undefined;
    return categories.find((c) => c.id === catId);
  };

  // Filter reminders
  const filtered = reminders.filter((r) => {
    // Category filter
    if (selectedCategory !== 'all' && r.categoryId !== selectedCategory) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    // Completed visibility rule:
    // If user is Premium and has toggled showCompleted to false, hide completed.
    // Otherwise show them.
    if (!showCompleted && r.isCompleted) {
      return false;
    }
    return true;
  });

  // Sort: Incomplete first (by date and time), then completed (by completedAt or date)
  const sorted = [...filtered].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    const dtA = `${a.date}T${a.time}`;
    const dtB = `${b.date}T${b.time}`;
    return dtA.localeCompare(dtB);
  });

  const completedCount = reminders.filter((r) => r.isCompleted).length;

  const formatDateLabel = (dateStr: string, timeStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    let prefix = dateStr;
    if (dateStr === today) prefix = 'Today';
    else if (dateStr === tomorrow) prefix = 'Tomorrow';
    else {
      const d = new Date(`${dateStr}T12:00:00`);
      prefix = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return `${prefix} · ${timeStr}`;
  };

  const isOverdue = (reminder: Reminder) => {
    if (reminder.isCompleted) return false;
    if (reminder.snoozedUntil) {
      return new Date(reminder.snoozedUntil).getTime() < Date.now();
    }
    const reminderDateTime = new Date(`${reminder.date}T${reminder.time}:00`);
    return reminderDateTime.getTime() < Date.now();
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reminders..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Completed Reminders Control (Section: Completed Reminders Free vs Premium) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isPremium ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleShowCompleted}
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                title={showCompleted ? 'Hide completed reminders from list' : 'Show completed reminders'}
              >
                {showCompleted ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                <span>{showCompleted ? 'Hide Completed' : 'Show Completed'}</span>
                {completedCount > 0 && <span className="text-[11px] text-slate-400 tabular-nums">({completedCount})</span>}
              </button>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setClearCompletedConfirm(true)}
                  className="h-9 px-2.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition-colors flex items-center gap-1"
                  title="Permanently clear completed reminders"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Completed</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {completedCount} completed
              </span>
              <button
                type="button"
                onClick={onOpenPremium}
                className="h-9 px-2.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                title="Premium allows hiding & bulk clearing completed tasks"
              >
                <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Hide Completed</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Bulk Clearing Completed */}
      {clearCompletedConfirm && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/40 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                Permanently delete all {completedCount} completed reminders?
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                This action cannot be undone. Active incomplete reminders will remain safe.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setClearCompletedConfirm(false)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClearAllCompleted();
                setClearCompletedConfirm(false);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Individual Permanent Delete (Premium) */}
      {deleteConfirmId && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-slate-900 dark:text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs text-rose-900 dark:text-rose-200">
              Permanently delete this completed reminder?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteReminder(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Reminder Rows */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No reminders found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No reminders matching "${searchQuery}".`
              : 'Speak or type above to add appointments, bills, or tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((reminder) => {
            const category = getCategory(reminder.categoryId);
            const overdue = isOverdue(reminder);

            return (
              <div
                key={reminder.id}
                className={`group relative rounded-xl border transition-all ${
                  reminder.isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500'
                    : overdue
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/70 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="p-3.5 sm:p-4 flex items-start gap-3">
                  {/* Subtle Grey Checkmark Icon (Mandatory Section Requirement) */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(reminder.id)}
                    className={`mt-0.5 min-w-[24px] min-h-[24px] w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      reminder.isCompleted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'
                        : 'border border-slate-300 dark:border-slate-600 hover:border-teal-500 text-transparent hover:text-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/30'
                    }`}
                    title={reminder.isCompleted ? 'Mark as incomplete (undo)' : 'Mark as completed'}
                    aria-label={reminder.isCompleted ? 'Undo completion' : 'Complete reminder'}
                  >
                    <Check className={`w-3.5 h-3.5 ${reminder.isCompleted ? 'text-slate-500 dark:text-slate-400' : ''}`} />
                  </button>

                  {/* Reminder Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Title with strikethrough when completed */}
                      <span
                        className={`text-sm font-medium leading-snug break-words ${
                          reminder.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {reminder.title}
                      </span>

                      {/* Overdue Badge (Explicit Requirement: Once the reminder has passed, you should see " Overdue " written on it) */}
                      {overdue && (
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                          <span>Overdue</span>
                        </span>
                      )}

                      {/* Sample Test Reminder Badge (Section 12) */}
                      {reminder.isTestReminder && (
                        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Sample Test Reminder
                        </span>
                      )}
                    </div>

                    {/* Metadata line adhering to Zero-Pill discipline (clean unboxed text with · separators) */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}>
                        {formatDateLabel(reminder.date, reminder.time)}
                      </span>

                      {overdue && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Overdue</span>
                        </>
                      )}

                      {category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={category.textColor}>{category.name}</span>
                        </>
                      )}

                      {reminder.recurrence !== 'none' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{reminder.recurrence}</span>
                        </>
                      )}

                      {reminder.isSubscription && reminder.subscriptionMeta?.cost && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-teal-600 dark:text-teal-400 font-medium">
                            ${reminder.subscriptionMeta.cost.toFixed(2)}
                          </span>
                        </>
                      )}

                      {reminder.snoozedUntil && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                            Snoozed until {new Date(reminder.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>

                    {reminder.notes && (
                      <p className={`text-xs mt-1.5 line-clamp-2 ${reminder.isCompleted ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {reminder.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Menu with Direct 1-Tap Quick-Access Snooze Button */}
                  <div className="relative shrink-0 flex items-center gap-1.5">
                    {/* Quick-Access 1-Tap Snooze Button directly on each active reminder card */}
                    {!reminder.isCompleted && (
                      <button
                        type="button"
                        onClick={() => onSnoozeReminder(reminder.id, 15)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-300 dark:hover:border-teal-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Snooze 15 minutes (one-tap)"
                        aria-label={`Snooze ${reminder.title} for 15 minutes`}
                      >
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>Snooze</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">15m</span>
                      </button>
                    )}

                    {/* Undo completion button if completed */}
                    {reminder.isCompleted && (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(reminder.id)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                        title="Restore reminder"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Undo</span>
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => onEditReminder(reminder)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit reminder"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (with confirmation if completed and Premium per Section 15 / Completed section) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (reminder.isCompleted && isPremium) {
                          setDeleteConfirmId(reminder.id);
                        } else {
                          onDeleteReminder(reminder.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
