import React, { useState } from 'react';
import {
  X,
  Shield,
  Bell,
  Volume2,
  Download,
  Trash2,
  Sparkles,
  CreditCard,
  Mail,
  CheckCircle,
  AlertCircle,
  Info,
  Smartphone,
  Mic
} from 'lucide-react';
import { UserPlan, UserPreferences, Reminder, SentEmail, NotificationTone } from '../types/reminder';
import { playNotificationTone } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: UserPlan;
  preferences: UserPreferences;
  reminders: Reminder[];
  sentEmails: SentEmail[];
  notificationPermissionGranted: boolean;
  onRequestNotifications: () => void;
  onTestNotification: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onCancelSubscription: () => void;
  onOpenPremium: () => void;
  onOpenEmailViewer: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userPlan,
  preferences,
  reminders,
  sentEmails,
  notificationPermissionGranted,
  onRequestNotifications,
  onTestNotification,
  onUpdatePreferences,
  onCancelSubscription,
  onOpenPremium,
  onOpenEmailViewer,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'data'>('account');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);

  if (!isOpen) return null;

  const isPremium = userPlan.tier === 'PREMIUM';

  // Export JSON - Strictly Premium Only
  const handleExportJSON = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reminders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vocalis_reminders_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV - Strictly Premium Only
  const handleExportCSV = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    const headers = ['ID', 'Title', 'Date', 'Time', 'Category', 'Completed', 'Recurrence', 'Notes'];
    const rows = reminders.map((r) => [
      `"${r.id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.categoryId || ''}"`,
      r.isCompleted ? 'Yes' : 'No',
      `"${r.recurrence}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vocalis_reminders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Settings &amp; Preferences
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl my-4">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'account' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Plan &amp; Account
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'notifications' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'privacy' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Privacy &amp; Mic
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'data' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Data &amp; Export
          </button>
        </div>

        {/* TAB 1: Account & Plan */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Current Tier
                </span>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Premium Active</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Free Plan
                  </span>
                )}
              </div>

              {isPremium ? (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <p><strong>Plan:</strong> {userPlan.planType === 'annual' ? 'Annual (US$19.99/year)' : 'Monthly (US$2.99/month)'}</p>
                  <p><strong>Billing Processor:</strong> Google Play Billing</p>
                  {userPlan.transactionId && (
                    <p><strong>Google Play Order ID:</strong> <span className="font-mono text-[11px]">{userPlan.transactionId}</span></p>
                  )}
                  {userPlan.expiresAt && (
                    <p><strong>Next Renewal:</strong> {new Date(userPlan.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  )}
                  <p className="text-[11px] text-teal-600 dark:text-teal-400">
                    Auto-renewal is active via Google Play. If you cancel, your saved reminders and custom categories remain 100% intact.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 pt-1">
                  <p>You have full access to voice &amp; typed reminder creation, 6 standard categories, and interactive calendar views.</p>
                  <button
                    onClick={onOpenPremium}
                    className="w-full py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade via Google Play (From $2.99/mo)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Email receipts button */}
            {sentEmails.length > 0 && (
              <button
                onClick={onOpenEmailViewer}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span>View Google Play Subscription Receipts ({sentEmails.length})</span>
                </div>
                <span className="text-teal-600 font-semibold">&rarr;</span>
              </button>
            )}

            {/* Cancellation Option for Premium */}
            {isPremium && (
              <div className="pt-2">
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Cancel Google Play Subscription
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 space-y-2">
                    <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                      Cancel auto-renewal? You will keep Premium access until the end of your billing cycle. Your reminders will never be deleted.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 cursor-pointer"
                      >
                        Keep Premium
                      </button>
                      <button
                        onClick={() => {
                          onCancelSubscription();
                          setConfirmCancel(false);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white cursor-pointer"
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Browser &amp; System Notifications
                </span>
                <span className={`text-xs font-semibold ${notificationPermissionGranted ? 'text-teal-600' : 'text-amber-600'}`}>
                  {notificationPermissionGranted ? 'Active / Granted' : 'Permission Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allows reminders to display system banners and trigger acoustic alerts when due.
              </p>
              {!notificationPermissionGranted && (
                <button
                  onClick={onRequestNotifications}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Enable Notifications
                </button>
              )}
            </div>

            {/* Test Notification Action (Section 12 Requirement) */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Test Reminder Alert
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Instantly trigger an audio chime and test banner to ensure device volume &amp; permissions work.
                  </p>
                </div>
                <button
                  onClick={onTestNotification}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  Test Alert Now
                </button>
              </div>
            </div>

            {/* Default Tone Picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Default Alert Sound
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gentle_chime', name: 'Gentle Chime (Default)' },
                  { id: 'modern_pulse', name: 'Modern Pulse' },
                  { id: 'digital_bell', name: 'Digital Bell' },
                  { id: 'soft_marimba', name: 'Soft Marimba' },
                  { id: 'android_echo', name: 'Android Echo' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onUpdatePreferences({ defaultTone: t.id as NotificationTone });
                      playNotificationTone(t.id as NotificationTone);
                    }}
                    className={`p-2 rounded-xl text-xs border text-left flex items-center justify-between ${
                      preferences.defaultTone === t.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.name}</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Privacy & Microphone (Section 13) */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Mic className="w-4 h-4 text-teal-600" />
                <span>Microphone &amp; Voice Privacy</span>
              </div>
              <p>
                Microphone audio is accessed only when you explicitly press the microphone button. Audio is translated into text locally via the Web Speech API or parsed into structured reminders via secure server calls. Your voice is never recorded or stored.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Local Storage &amp; Encryption</span>
              </div>
              <p>
                All your reminders, notes, and custom categories are stored locally in your browser/device database. No account passwords or banking numbers are stored.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Google Play Billing &amp; Payment Credentials</span>
              </div>
              <p>
                All purchases and subscription renewals are handled exclusively via Google Play Billing. The app never accesses, handles, or stores banking details or credit card numbers. Subscriptions and cancellations are managed directly through your Google Play Store account.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Data & Export */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Export Reminder History
                </h4>
                {!isPremium && (
                  <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Premium Only</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isPremium
                  ? 'Download your complete schedule, completed items, and notes for external backup.'
                  : 'Only Premium users can export their reminder data. Upgrade to download your complete history in JSON or CSV format.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPremium
                      ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      : 'border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/40'
                  }`}
                  title={isPremium ? 'Download JSON file' : 'Upgrade to Premium to export JSON'}
                >
                  {isPremium ? <Download className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-teal-600" />}
                  <span>Export JSON {!isPremium && '(Premium)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPremium
                      ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      : 'border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/40'
                  }`}
                  title={isPremium ? 'Download CSV file' : 'Upgrade to Premium to export CSV'}
                >
                  {isPremium ? <Download className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-teal-600" />}
                  <span>Export CSV {!isPremium && '(Premium)'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              {!confirmClearData ? (
                <button
                  onClick={() => setConfirmClearData(true)}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset / Clear All Reminders</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 space-y-2">
                  <p className="text-xs text-rose-900 dark:text-rose-200 font-semibold">
                    Are you sure you want to delete all reminders?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmClearData(false)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onClearAllData();
                        setConfirmClearData(false);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
