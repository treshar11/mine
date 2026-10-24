import React from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { ActiveAlert } from '../utils/notifications';

interface ActiveAlertBannerProps {
  alerts: ActiveAlert[];
  onDismiss: (id: string) => void;
  onComplete: (reminderId: string, alertId: string) => void;
  onSnooze: (reminderId: string, alertId: string, minutes: number) => void;
}

export const ActiveAlertBanner: React.FC<ActiveAlertBannerProps> = ({
  alerts,
  onDismiss,
  onComplete,
  onSnooze,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700/80 flex flex-col gap-2 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                  {alert.alertType === 'due' ? 'Reminder Due Now' : `Upcoming in ${alert.minutesBefore}m`}
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {alert.reminder.title}
                </h4>
                {alert.reminder.notes && (
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                    {alert.reminder.notes}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.id)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => onSnooze(alert.reminder.id, alert.id, 15)}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Snooze 15m</span>
            </button>

            <button
              onClick={() => onComplete(alert.reminder.id, alert.id)}
              className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Mark Done</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
