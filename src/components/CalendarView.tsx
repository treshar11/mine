import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Tag,
  Trash2,
  Edit2,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Reminder, Category, CategoryId, UserPlan } from '../types/reminder';

interface CalendarViewProps {
  reminders: Reminder[];
  categories: Category[];
  userPlan: UserPlan;
  showCompleted: boolean;
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (catId: CategoryId | 'all') => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onEditReminder: (reminder: Reminder) => void;
  onAddReminderOnDate: (date: string, time?: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  reminders,
  categories,
  userPlan,
  showCompleted,
  selectedCategory,
  onSelectCategory,
  onToggleComplete,
  onDeleteReminder,
  onEditReminder,
  onAddReminderOnDate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const getCategory = (catId?: string | null): Category | undefined => {
    if (!catId) return undefined;
    return categories.find((c) => c.id === catId);
  };

  const isOverdue = (reminder: Reminder) => {
    if (reminder.isCompleted) return false;
    if (reminder.snoozedUntil) {
      return new Date(reminder.snoozedUntil).getTime() < Date.now();
    }
    const reminderDateTime = new Date(`${reminder.date}T${reminder.time}:00`);
    return reminderDateTime.getTime() < Date.now();
  };

  // Filter reminders by category and completed visibility
  const visibleReminders = reminders.filter((r) => {
    if (selectedCategory !== 'all' && r.categoryId !== selectedCategory) return false;
    if (!showCompleted && r.isCompleted) return false;
    return true;
  });

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  // Header Title
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Month grid calculation
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: true,
      });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // Week days calculation
  const getDaysInWeek = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
      });
    }
    return days;
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDayReminders = visibleReminders.filter((r) => r.date === selectedDateStr);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Calendar Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'day') {
                  setCurrentDate(new Date(`${selectedDateStr}T12:00:00`));
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Center: Month/Week/Day Date Title & Arrows */}
        <div className="flex items-center justify-between sm:justify-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[140px] text-center">
            {getHeaderTitle()}
          </span>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Next"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right: Category filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value as CategoryId | 'all')}
            className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Days of Week Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900"
              >
                {d}
              </div>
            ))}

            {/* Days Cells */}
            {getDaysInMonth().map((cell, idx) => {
              const dayReminders = visibleReminders.filter((r) => r.date === cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[88px] p-1.5 flex flex-col justify-between text-left transition-colors relative ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  } ${isSelected ? 'ring-2 ring-teal-500 ring-inset z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-teal-600 text-white font-bold'
                          : isSelected
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {dayReminders.length > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                        {dayReminders.length}
                      </span>
                    )}
                  </div>

                  {/* Reminder preview dots/labels */}
                  <div className="space-y-1 w-full mt-1">
                    {dayReminders.slice(0, 2).map((r) => {
                      const cat = getCategory(r.categoryId);
                      return (
                        <div
                          key={r.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            r.isCompleted
                              ? 'line-through text-slate-400 bg-slate-100 dark:bg-slate-800/50'
                              : cat
                              ? `${cat.bgLight} font-medium`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {r.time} {r.title}
                        </div>
                      );
                    })}
                    {dayReminders.length > 2 && (
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 px-1">
                        +{dayReminders.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Reminders Pane */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Reminders for{' '}
                  {new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => onAddReminderOnDate(selectedDateStr, '09:00')}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-teal-600 rounded-lg hover:bg-slate-800 dark:hover:bg-teal-500 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reminder</span>
              </button>
            </div>

            {selectedDayReminders.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                No reminders scheduled for this date.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDayReminders.map((r) => {
                  const cat = getCategory(r.categoryId);
                  return (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                        r.isCompleted
                          ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleComplete(r.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            r.isCompleted
                              ? 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                              : 'border border-slate-300 dark:border-slate-600 hover:border-teal-500 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-medium truncate ${r.isCompleted ? 'line-through text-slate-400' : ''}`}>
                              {r.title}
                            </p>
                            {isOverdue(r) && (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.2 rounded">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className={isOverdue(r) ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>{r.time}</span>
                            {isOverdue(r) && (
                              <>
                                <span>·</span>
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">Overdue</span>
                              </>
                            )}
                            {cat && (
                              <>
                                <span>·</span>
                                <span className={cat.textColor}>{cat.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditReminder(r)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {getDaysInWeek().map((day, idx) => {
            const dayReminders = visibleReminders.filter((r) => r.date === day.dateStr);
            const isToday = day.dateStr === todayStr;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col justify-between min-h-[180px] ${
                  isToday
                    ? 'border-teal-500/80 bg-teal-50/20 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-teal-600 text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {dayReminders.map((r) => {
                      const cat = getCategory(r.categoryId);
                      return (
                        <div
                          key={r.id}
                          onClick={() => onEditReminder(r)}
                          className={`p-1.5 rounded-lg text-[11px] cursor-pointer hover:opacity-90 transition-opacity ${
                            r.isCompleted
                              ? 'line-through text-slate-400 bg-slate-100 dark:bg-slate-800/40'
                              : cat
                              ? `${cat.bgLight}`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="font-semibold">{r.time}</div>
                          <div className="truncate">{r.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddReminderOnDate(day.dateStr, '09:00')}
                  className="mt-3 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h4>
              <p className="text-xs text-slate-500">
                {visibleReminders.filter((r) => r.date === currentDate.toISOString().slice(0, 10)).length} reminders scheduled
              </p>
            </div>
            <button
              onClick={() => onAddReminderOnDate(currentDate.toISOString().slice(0, 10), '09:00')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reminder</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
              const hourStr = hour.toString().padStart(2, '0');
              const displayTime = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
              const dayStr = currentDate.toISOString().slice(0, 10);
              const hourReminders = visibleReminders.filter(
                (r) => r.date === dayStr && r.time.startsWith(hourStr)
              );

              return (
                <div key={hour} className="py-2.5 flex items-start gap-3 group">
                  <span className="w-16 text-xs text-slate-400 font-mono tabular-nums shrink-0 pt-0.5">
                    {displayTime}
                  </span>

                  <div className="flex-1 min-h-[32px] flex flex-wrap items-center gap-2">
                    {hourReminders.map((r) => {
                      const cat = getCategory(r.categoryId);
                      return (
                        <div
                          key={r.id}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-2 border ${
                            r.isCompleted
                              ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 text-slate-400 line-through'
                              : cat
                              ? `${cat.bgLight} border-transparent`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleComplete(r.id)}
                            className="w-3.5 h-3.5 rounded flex items-center justify-center border border-current"
                          >
                            {r.isCompleted && <Check className="w-2.5 h-2.5" />}
                          </button>
                          <span
                            onClick={() => onEditReminder(r)}
                            className="font-medium cursor-pointer"
                          >
                            {r.title} ({r.time})
                          </span>
                        </div>
                      );
                    })}

                    {hourReminders.length === 0 && (
                      <button
                        type="button"
                        onClick={() => onAddReminderOnDate(dayStr, `${hourStr}:00`)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add slot</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
