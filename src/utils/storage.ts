import { Category, Reminder, UserPlan, UserPreferences, SentEmail } from '../types/reminder';

export const STANDARD_CATEGORIES: Category[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    iconName: 'User',
    isCustom: false,
    description: 'Everyday tasks, family commitments, birthdays, and personal goals.',
  },
  {
    id: 'work',
    name: 'Work',
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconName: 'Briefcase',
    isCustom: false,
    description: 'Work assignments, meetings, deadlines, and professional tasks.',
  },
  {
    id: 'bills',
    name: 'Bills & Payments',
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    textColor: 'text-amber-600 dark:text-amber-400',
    iconName: 'CreditCard',
    isCustom: false,
    description: 'Rent, utilities, loan payments, and other financial due dates.',
  },
  {
    id: 'appointments',
    name: 'Appointments',
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    textColor: 'text-purple-600 dark:text-purple-400',
    iconName: 'CalendarCheck',
    isCustom: false,
    description: 'Medical visits, meetings, and scheduled appointments.',
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions & Free Trials',
    color: 'bg-teal-500',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    textColor: 'text-teal-600 dark:text-teal-400',
    iconName: 'Repeat',
    isCustom: false,
    description: 'Renewal dates, trial expirations, and cancellation reminders.',
  },
  {
    id: 'other',
    name: 'Other',
    color: 'bg-slate-500',
    bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    textColor: 'text-slate-600 dark:text-slate-400',
    iconName: 'Bookmark',
    isCustom: false,
    description: 'Reminders that do not fit into the other categories.',
  },
];

const STORAGE_KEYS = {
  REMINDERS: 'vocalis_reminders_v1',
  CUSTOM_CATEGORIES: 'vocalis_custom_categories_v1',
  USER_PLAN: 'vocalis_user_plan_v1',
  PREFERENCES: 'vocalis_preferences_v1',
  SENT_EMAILS: 'vocalis_sent_emails_v1',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  showCompletedReminders: true,
  defaultTone: 'gentle_chime',
  categoryTones: {},
  notificationsEnabled: true,
  hasSeenFirstLaunchWelcome: false,
  testReminderDeleted: false,
};

export const DEFAULT_PLAN: UserPlan = {
  tier: 'FREE',
  active: true,
};

export function loadUserPlan(): UserPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PLAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user plan', e);
  }
  return DEFAULT_PLAN;
}

export function saveUserPlan(plan: UserPlan) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Failed to save user plan', e);
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load preferences', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveUserPreferences(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences', e);
  }
}

export function loadCustomCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom categories', e);
  }
  return [];
}

export function saveCustomCategories(cats: Category[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save custom categories', e);
  }
}

export function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load reminders', e);
  }

  // First run initialization: Create Section 12 "Test Reminder — Delete Me"
  const prefs = loadUserPreferences();
  if (!prefs.testReminderDeleted) {
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    const dateStr = oneHourLater.toISOString().slice(0, 10);
    const timeStr = oneHourLater.toTimeString().slice(0, 5);

    const initialTestReminder: Reminder = {
      id: 'test-reminder-first-run',
      title: 'Test Reminder — Delete Me',
      notes: 'Sample reminder scheduled for 1 hour after first launch to test alerts. Tap the checkmark to complete or delete anytime.',
      date: dateStr,
      time: timeStr,
      categoryId: 'other',
      isCompleted: false,
      recurrence: 'none',
      advanceAlerts: [0],
      isTestReminder: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveReminders([initialTestReminder]);
    return [initialTestReminder];
  }

  return [];
}

export function saveReminders(reminders: Reminder[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders', e);
  }
}

export function loadSentEmails(): SentEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENT_EMAILS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sent emails', e);
  }
  return [];
}

export function saveSentEmail(email: SentEmail) {
  try {
    const emails = loadSentEmails();
    const updated = [email, ...emails.filter((e) => e.id !== email.id)];
    localStorage.setItem(STORAGE_KEYS.SENT_EMAILS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email', e);
  }
}
