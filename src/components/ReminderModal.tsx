import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  Repeat,
  Bell,
  Volume2,
  DollarSign,
  Link as LinkIcon,
  Sparkles,
  Check
} from 'lucide-react';
import {
  Reminder,
  Category,
  CategoryId,
  RecurrenceType,
  NotificationTone,
  UserPlan
} from '../types/reminder';
import { playNotificationTone } from '../utils/audio';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: Reminder | null;
  initialDate?: string;
  initialTime?: string;
  categories: Category[];
  userPlan: UserPlan;
  onSave: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  onOpenPremium: () => void;
}

const TONES: { id: NotificationTone; name: string; isPremiumOnly: boolean }[] = [
  { id: 'gentle_chime', name: 'Gentle Chime', isPremiumOnly: false },
  { id: 'modern_pulse', name: 'Modern Pulse', isPremiumOnly: true },
  { id: 'digital_bell', name: 'Digital Bell', isPremiumOnly: true },
  { id: 'soft_marimba', name: 'Soft Marimba', isPremiumOnly: true },
  { id: 'android_echo', name: 'Android Echo', isPremiumOnly: true },
];

const PRESET_ADVANCE_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 10, label: '10 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: 4320, label: '3 days before' },
  { value: 10080, label: '7 days before' },
  { value: 21600, label: '15 days before' },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminder,
  initialDate,
  initialTime,
  categories,
  userPlan,
  onSave,
  onOpenPremium,
}) => {
  const isPremium = userPlan.tier === 'PREMIUM';

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [categoryId, setCategoryId] = useState<CategoryId | null>('personal');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [advanceAlerts, setAdvanceAlerts] = useState<number[]>([0]);
  const [tone, setTone] = useState<NotificationTone>('gentle_chime');

  // Subscription metadata
  const [isSubscription, setIsSubscription] = useState(false);
  const [subCost, setSubCost] = useState('');
  const [subCycle, setSubCycle] = useState<'monthly' | 'annual' | 'quarterly' | 'weekly'>('monthly');
  const [isTrial, setIsTrial] = useState(false);
  const [cancellationNotes, setCancellationNotes] = useState('');
  const [cancellationUrl, setCancellationUrl] = useState('');

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setNotes(reminder.notes || '');
      setDate(reminder.date);
      setTime(reminder.time);
      setCategoryId(reminder.categoryId || null);
      setRecurrence(reminder.recurrence);
      setAdvanceAlerts(reminder.advanceAlerts?.length ? reminder.advanceAlerts : [0]);
      setTone(reminder.customTone || 'gentle_chime');

      if (reminder.isSubscription || reminder.categoryId === 'subscriptions' || reminder.subscriptionMeta) {
        setIsSubscription(true);
        setSubCost(reminder.subscriptionMeta?.cost?.toString() || '');
        setSubCycle(reminder.subscriptionMeta?.billingCycle || 'monthly');
        setIsTrial(!!reminder.subscriptionMeta?.isTrial);
        setCancellationNotes(reminder.subscriptionMeta?.cancellationNotes || '');
        setCancellationUrl(reminder.subscriptionMeta?.cancellationUrl || '');
      } else {
        setIsSubscription(false);
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setNotes('');
      setDate(initialDate || today);
      setTime(initialTime || '09:00');
      setCategoryId('personal');
      setRecurrence('none');
      setAdvanceAlerts([0]);
      setTone('gentle_chime');
      setIsSubscription(false);
      setSubCost('');
      setSubCycle('monthly');
      setIsTrial(false);
      setCancellationNotes('');
      setCancellationUrl('');
    }
  }, [reminder, initialDate, initialTime, isOpen]);

  if (!isOpen) return null;

  const handleToggleAdvanceAlert = (val: number) => {
    if (isPremium) {
      if (advanceAlerts.includes(val)) {
        if (advanceAlerts.length > 1) {
          setAdvanceAlerts(advanceAlerts.filter((v) => v !== val));
        }
      } else {
        setAdvanceAlerts([...advanceAlerts, val]);
      }
    } else {
      // Free users single selection
      setAdvanceAlerts([val]);
    }
  };

  const handleSelectTone = (selectedTone: NotificationTone, isPremiumOnly: boolean) => {
    if (isPremiumOnly && !isPremium) {
      onOpenPremium();
      return;
    }
    setTone(selectedTone);
    playNotificationTone(selectedTone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const subCostNum = subCost ? parseFloat(subCost) : undefined;
    const finalIsSub = isSubscription || categoryId === 'subscriptions';

    onSave(
      {
        title: title.trim(),
        notes: notes.trim() || undefined,
        date: date || new Date().toISOString().slice(0, 10),
        time: time || '09:00',
        categoryId,
        isCompleted: reminder ? reminder.isCompleted : false,
        recurrence,
        advanceAlerts: advanceAlerts.length > 0 ? advanceAlerts : [0],
        customTone: tone,
        isSubscription: finalIsSub,
        subscriptionMeta: finalIsSub
          ? {
              cost: subCostNum,
              billingCycle: subCycle,
              isTrial,
              cancellationNotes: cancellationNotes.trim() || undefined,
              cancellationUrl: cancellationUrl.trim() || undefined,
            }
          : undefined,
      },
      reminder ? reminder.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {reminder ? 'Edit Reminder' : 'Create Reminder'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to be reminded of?"
              className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, address, checklist..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Category & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Category (Optional)</span>
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? e.target.value : null)}
                className="w-full h-10 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isCustom ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-slate-400" />
                <span>Recurrence</span>
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full h-10 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Advance Alerts Section (Free: 1 alert; Premium: Multiple advance alerts) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>Advance Alerts</span>
              </label>
              {isPremium ? (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  Multi-Alerts Enabled
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPremium}
                  className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Unlock Multiple Alerts</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_ADVANCE_OPTIONS.map((opt) => {
                const isSelected = advanceAlerts.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleAdvanceAlert(opt.value)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border text-left transition-colors truncate ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Tone Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Alert Sound Tone</span>
              </label>
              <button
                type="button"
                onClick={() => playNotificationTone(tone)}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Preview Tone</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TONES.map((t) => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTone(t.id, t.isPremiumOnly)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.name}</span>
                    {t.isPremiumOnly && !isPremium && (
                      <Sparkles className="w-2.5 h-2.5 text-teal-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscription & Free Trial Extra Details Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsSubscription(!isSubscription)}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 mb-2"
            >
              <span>{isSubscription ? '− Hide Subscription & Trial Details' : '+ Add Subscription / Trial Details'}</span>
            </button>

            {isSubscription && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Renewal Amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={subCost}
                      onChange={(e) => setSubCost(e.target.value)}
                      placeholder="e.g. 14.99"
                      className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={subCycle}
                      onChange={(e) => setSubCycle(e.target.value as any)}
                      className="w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-trial-checkbox"
                    checked={isTrial}
                    onChange={(e) => setIsTrial(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <label htmlFor="is-trial-checkbox" className="text-xs text-slate-700 dark:text-slate-300">
                    This is an active Free Trial expiring on the reminder date
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cancellation Page URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={cancellationUrl}
                    onChange={(e) => setCancellationUrl(e.target.value)}
                    placeholder="https://service.com/account/cancel"
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cancellation Notes
                  </label>
                  <input
                    type="text"
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                    placeholder="e.g. Go to Account Settings > Subscriptions > Cancel"
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              {reminder ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
