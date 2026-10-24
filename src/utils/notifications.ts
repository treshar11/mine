import { Reminder, NotificationTone } from '../types/reminder';
import { playNotificationTone } from './audio';

// Tracks alerts already fired in the current session so they never trigger twice
const firedAlerts = new Set<string>();

export interface ActiveAlert {
  id: string;
  reminder: Reminder;
  alertType: 'due' | 'advance';
  minutesBefore?: number;
  firedAt: string;
}

type AlertListener = (alert: ActiveAlert) => void;
const listeners: AlertListener[] = [];

export function subscribeToAlerts(listener: AlertListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function triggerReminderAlert(
  reminder: Reminder,
  alertType: 'due' | 'advance',
  minutesBefore?: number,
  tone?: NotificationTone
) {
  const alertKey = `${reminder.id}_${alertType}_${minutesBefore || 0}_${reminder.date}_${reminder.time}`;
  if (firedAlerts.has(alertKey)) {
    return;
  }
  firedAlerts.add(alertKey);

  // Play audio chime
  playNotificationTone(tone || reminder.customTone || 'gentle_chime');

  // Vibrate Android device if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 80, 120]);
    } catch (e) {
      // Ignore vibration error on non-touch devices
    }
  }

  // System Notification
  const title = alertType === 'due'
    ? `🔔 Reminder: ${reminder.title}`
    : `⏰ Upcoming: ${reminder.title} (in ${formatMinutes(minutesBefore || 0)})`;

  const body = reminder.notes || `Scheduled for ${reminder.time} today`;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: alertKey,
      });
    } catch (err) {
      console.warn('System notification error:', err);
    }
  }

  // Notify in-app UI listeners
  const activeAlert: ActiveAlert = {
    id: alertKey,
    reminder,
    alertType,
    minutesBefore,
    firedAt: new Date().toISOString(),
  };

  listeners.forEach((l) => l(activeAlert));
}

function formatMinutes(mins: number): string {
  if (mins >= 1440) {
    const days = Math.round(mins / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (mins >= 60) {
    const hours = Math.round(mins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${mins} minutes`;
}

// Evaluates reminders against current time to trigger alerts
export function checkUpcomingReminders(reminders: Reminder[], categoryTones: Record<string, NotificationTone> = {}) {
  const now = new Date();
  const currentTimestamp = now.getTime();

  reminders.forEach((r) => {
    if (r.isCompleted) return;

    // Check if snoozed
    if (r.snoozedUntil) {
      const snoozeTime = new Date(r.snoozedUntil).getTime();
      if (currentTimestamp >= snoozeTime && currentTimestamp - snoozeTime < 60000) {
        const tone = (r.categoryId && categoryTones[r.categoryId]) || r.customTone || 'gentle_chime';
        triggerReminderAlert(r, 'due', 0, tone);
      }
      return;
    }

    const reminderDateTime = new Date(`${r.date}T${r.time}:00`);
    const reminderTimestamp = reminderDateTime.getTime();
    const diffMs = reminderTimestamp - currentTimestamp;
    const diffMinutes = Math.round(diffMs / 60000);

    const tone = (r.categoryId && categoryTones[r.categoryId]) || r.customTone || 'gentle_chime';

    // 1. Due Alert: within 1 minute of due time or just passed in the last 60 seconds
    if (diffMs <= 30000 && diffMs >= -60000) {
      triggerReminderAlert(r, 'due', 0, tone);
    }

    // 2. Advance Alerts (e.g. 10m, 60m, 1440m before)
    if (r.advanceAlerts && r.advanceAlerts.length > 0) {
      r.advanceAlerts.forEach((advanceMin) => {
        if (advanceMin > 0) {
          // If within 1 minute of the advance alert window
          const targetAdvanceMs = advanceMin * 60000;
          const advanceDiff = diffMs - targetAdvanceMs;
          if (advanceDiff <= 30000 && advanceDiff >= -30000) {
            triggerReminderAlert(r, 'advance', advanceMin, tone);
          }
        }
      });
    }
  });
}
