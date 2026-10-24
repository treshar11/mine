export type CategoryId =
  | 'personal'
  | 'work'
  | 'bills'
  | 'appointments'
  | 'subscriptions'
  | 'other'
  | string;

export interface Category {
  id: CategoryId;
  name: string;
  color: string; // Tailwind color class or hex
  bgLight: string;
  textColor: string;
  iconName: string;
  isCustom?: boolean;
  description?: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'annually';

export interface SubscriptionMeta {
  cost?: number;
  billingCycle?: 'monthly' | 'annual' | 'quarterly' | 'weekly';
  isTrial?: boolean;
  trialExpiresAt?: string;
  cancellationNotes?: string;
  cancellationUrl?: string;
  isCancelled?: boolean;
  cancelledAt?: string;
}

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hour)
  categoryId: CategoryId | null;
  isCompleted: boolean;
  completedAt?: string;
  recurrence: RecurrenceType;
  advanceAlerts: number[]; // e.g. [0] = at time, [15] = 15m before, [1440] = 1 day before
  customTone?: NotificationTone;
  isSubscription?: boolean;
  subscriptionMeta?: SubscriptionMeta;
  isTestReminder?: boolean;
  snoozedUntil?: string; // ISO string if currently snoozed
  createdAt: string;
  updatedAt: string;
}

export type NotificationTone =
  | 'gentle_chime'
  | 'modern_pulse'
  | 'digital_bell'
  | 'soft_marimba'
  | 'android_echo';

export interface UserPlan {
  tier: 'FREE' | 'PREMIUM';
  planType?: 'monthly' | 'annual';
  active: boolean;
  startDate?: string;
  expiresAt?: string;
  autoRenew?: boolean;
  transactionId?: string;
  orderId?: string;
  googlePlayOrderId?: string;
  purchaseToken?: string;
  paymentProcessor?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  showCompletedReminders: boolean; // Premium toggle to hide/show completed in lists & calendar
  defaultTone: NotificationTone;
  categoryTones: Record<string, NotificationTone>;
  notificationsEnabled: boolean;
  hasSeenFirstLaunchWelcome: boolean;
  testReminderDeleted: boolean;
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  transactionId: string;
  plan: string;
  amount: string;
  bodyHtml: string;
  bodyText: string;
}
