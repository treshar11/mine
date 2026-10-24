import React, { useState } from 'react';
import {
  Repeat,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle,
  Plus,
  Sparkles,
  DollarSign,
  Calendar,
  X,
  CreditCard,
  Trash2,
  Edit2
} from 'lucide-react';
import { Reminder, UserPlan } from '../types/reminder';

interface SubscriptionTrackerProps {
  reminders: Reminder[];
  userPlan: UserPlan;
  onOpenPremium: () => void;
  onAddSubscriptionReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onMarkSubscriptionCancelled: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const SubscriptionTracker: React.FC<SubscriptionTrackerProps> = ({
  reminders,
  userPlan,
  onOpenPremium,
  onAddSubscriptionReminder,
  onEditReminder,
  onMarkSubscriptionCancelled,
  onDeleteReminder,
}) => {
  const isPremium = userPlan.tier === 'PREMIUM';
  const [filterMode, setFilterMode] = useState<'all' | 'trials' | 'recurring'>('all');

  // Filter subscriptions
  const subs = reminders.filter(
    (r) => r.isSubscription || r.categoryId === 'subscriptions' || !!r.subscriptionMeta
  );

  const activeSubs = subs.filter((s) => !s.subscriptionMeta?.isCancelled);
  const cancelledSubs = subs.filter((s) => s.subscriptionMeta?.isCancelled);

  // Calculate monthly and annual totals
  let monthlyTotal = 0;
  let annualTotal = 0;

  activeSubs.forEach((s) => {
    const cost = s.subscriptionMeta?.cost || 0;
    const cycle = s.subscriptionMeta?.billingCycle || 'monthly';
    if (cycle === 'monthly') {
      monthlyTotal += cost;
      annualTotal += cost * 12;
    } else if (cycle === 'annual') {
      annualTotal += cost;
      monthlyTotal += cost / 12;
    } else if (cycle === 'weekly') {
      monthlyTotal += cost * 4.33;
      annualTotal += cost * 52;
    }
  });

  const filteredSubs = activeSubs.filter((s) => {
    if (filterMode === 'trials') return s.subscriptionMeta?.isTrial || s.title.toLowerCase().includes('trial');
    if (filterMode === 'recurring') return !s.subscriptionMeta?.isTrial && !s.title.toLowerCase().includes('trial');
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Estimated Monthly Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${monthlyTotal.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Based on active subscriptions</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Estimated Annual Spend</span>
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${annualTotal.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Projected for next 12 months</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Tracked Services &amp; Trials</span>
            <Repeat className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {activeSubs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {subs.filter((s) => s.subscriptionMeta?.isTrial || s.title.toLowerCase().includes('trial')).length} free trials active
          </p>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Services ({activeSubs.length})
          </button>
          <button
            onClick={() => setFilterMode('trials')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'trials'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Free Trials
          </button>
          <button
            onClick={() => setFilterMode('recurring')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'recurring'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Renewals
          </button>
        </div>

        <button
          onClick={onAddSubscriptionReminder}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription / Trial</span>
        </button>
      </div>

      {/* Premium Multiple Advance Alerts Callout if Free */}
      {!isPremium && (
        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/60 dark:bg-teal-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <p className="text-xs text-teal-900 dark:text-teal-200">
              <span className="font-semibold">Never miss a trial cutoff:</span> Premium unlocks multiple staggered advance alerts (e.g. 15, 5, and 1 day before expiration).
            </p>
          </div>
          <button
            onClick={onOpenPremium}
            className="px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-teal-800 shrink-0 hover:bg-teal-50"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Subscription Cards List */}
      {filteredSubs.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Repeat className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No subscriptions tracked yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Add your software renewals, streaming services, gym memberships, and trial periods to prevent unwanted charges.
          </p>
          <button
            onClick={onAddSubscriptionReminder}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-teal-600 rounded-xl"
          >
            Track First Subscription
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSubs.map((sub) => {
            const isTrial = sub.subscriptionMeta?.isTrial || sub.title.toLowerCase().includes('trial');
            const cost = sub.subscriptionMeta?.cost;
            const cycle = sub.subscriptionMeta?.billingCycle || 'monthly';

            return (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sub.title}
                      </span>
                      {isTrial && (
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Free Trial
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Renews / Expires: {sub.date} · {sub.time}</span>
                      {cost !== undefined && (
                        <>
                          <span>·</span>
                          <span className="font-mono tabular-nums text-teal-600 dark:text-teal-400 font-semibold">
                            ${cost.toFixed(2)} / {cycle}
                          </span>
                        </>
                      )}
                      {sub.advanceAlerts && sub.advanceAlerts.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{sub.advanceAlerts.length} alert{sub.advanceAlerts.length > 1 ? 's' : ''} scheduled</span>
                        </>
                      )}
                    </div>

                    {sub.subscriptionMeta?.cancellationNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                        Notes: {sub.subscriptionMeta.cancellationNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {sub.subscriptionMeta?.cancellationUrl && (
                      <a
                        href={sub.subscriptionMeta.cancellationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Cancel Link</span>
                      </a>
                    )}

                    <button
                      onClick={() => onMarkSubscriptionCancelled(sub.id)}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center gap-1 transition-colors"
                      title="Mark as cancelled by user (will not charge or recreate)"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Cancelled</span>
                    </button>

                    <button
                      onClick={() => onEditReminder(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteReminder(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete"
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

      {/* Cancelled Subscriptions Log */}
      {cancelledSubs.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Cancelled Services History ({cancelledSubs.length})
          </h4>
          <div className="space-y-1.5">
            {cancelledSubs.map((sub) => (
              <div
                key={sub.id}
                className="p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500"
              >
                <div>
                  <span className="line-through">{sub.title}</span>
                  <span className="text-[11px] ml-2 text-slate-400">
                    Cancelled on {new Date(sub.subscriptionMeta?.cancelledAt || sub.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteReminder(sub.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
