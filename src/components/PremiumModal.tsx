import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  X,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { UserPlan, SentEmail } from '../types/reminder';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: UserPlan;
  onPlanActivated: (plan: UserPlan, emailRecord?: SentEmail) => void;
  onViewEmail?: (email: SentEmail) => void;
}

// Google Play icon SVG
const GooglePlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.609 1.814L13.793 12 3.61 22.186A2.213 2.213 0 0 1 3 20.627V3.373c0-.6.224-1.15.609-1.559z" fill="#4285F4"/>
    <path d="M17.447 8.347L13.793 12l3.654 3.653 4.148-2.395a1.597 1.597 0 0 0 0-2.516l-4.148-2.395z" fill="#FBBC04"/>
    <path d="M13.793 12L3.609 1.814A2.08 2.08 0 0 1 4.773 1.5c.573 0 1.135.163 1.62.443l11.054 6.404L13.793 12z" fill="#EA4335"/>
    <path d="M13.793 12l3.654 3.653-11.054 6.404a2.27 2.27 0 0 1-1.62.443 2.08 2.08 0 0 1-1.164-.314L13.793 12z" fill="#34A853"/>
  </svg>
);

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  userPlan,
  onPlanActivated,
  onViewEmail,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'annual'>('annual');
  const [userEmail, setUserEmail] = useState('brilliantminds52@gmail.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'authorizing' | 'success'>('select');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [dispatchedEmail, setDispatchedEmail] = useState<SentEmail | null>(null);

  if (!isOpen) return null;

  const handleStartGooglePlayBilling = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google Account email.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setCheckoutStep('authorizing');

    try {
      // 1. Initiate purchase through Google Play Billing server API
      const initRes = await fetch('/api/play-billing/initiate-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId, userEmail }),
      });

      if (!initRes.ok) {
        throw new Error('Google Play Billing connection error.');
      }

      const initData = await initRes.json();
      const purchaseToken = initData.purchaseToken;

      // Simulate Google Play bottom sheet confirmation delay
      await new Promise((r) => setTimeout(r, 1100));

      // 2. Server verifies Google Play purchase token & issues GPA order ID
      const verifyRes = await fetch('/api/play-billing/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseToken,
          planId: selectedPlanId,
          userEmail,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Google Play purchase verification failed.');
      }

      const verifyData = await verifyRes.json();
      setCompletedTransaction(verifyData.transaction);

      // 3. Dispatch Section 10 Confirmation Email with Google Play Order ID
      const emailRes = await fetch('/api/send-confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          planId: selectedPlanId,
          amount: selectedPlanId === 'annual' ? 'US$19.99 / year' : 'US$2.99 / month',
          transactionId: verifyData.googlePlayOrderId,
          nextBillingDate: verifyData.transaction.nextBillingDate,
        }),
      });

      let emailObj: SentEmail | undefined = undefined;
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        emailObj = emailData.email;
        setDispatchedEmail(emailData.email);
      }

      // 4. Update entitlement in state & local storage
      const updatedPlan: UserPlan = {
        tier: 'PREMIUM',
        planType: selectedPlanId,
        active: true,
        startDate: verifyData.entitlement.startDate,
        expiresAt: verifyData.entitlement.expiresAt,
        autoRenew: true,
        transactionId: verifyData.googlePlayOrderId,
        orderId: verifyData.googlePlayOrderId,
        googlePlayOrderId: verifyData.googlePlayOrderId,
        purchaseToken: verifyData.entitlement.purchaseToken,
        paymentProcessor: 'Google Play Billing',
      };

      onPlanActivated(updatedPlan, emailObj);
      setCheckoutStep('success');
    } catch (err: any) {
      console.error('Google Play Billing error:', err);
      setErrorMessage(err.message || 'An error occurred during Google Play Billing checkout.');
      setCheckoutStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {checkoutStep === 'select' && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vocalis Premium</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Unlock Complete Customization
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Everyday core reminders remain free forever. Premium adds custom categories, multi-alerts, sound packs, and full data export.
              </p>
            </div>

            {/* Plan Selector Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Annual Plan */}
              <button
                type="button"
                onClick={() => setSelectedPlanId('annual')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  selectedPlanId === 'annual'
                    ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 ring-2 ring-teal-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white">
                  Save 44%
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Annual Plan
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    $19.99
                  </span>
                  <span className="text-xs text-slate-500">/ year</span>
                </div>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 block font-medium">
                  Includes 7-day free trial
                </span>
              </button>

              {/* Monthly Plan */}
              <button
                type="button"
                onClick={() => setSelectedPlanId('monthly')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedPlanId === 'monthly'
                    ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 ring-2 ring-teal-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Monthly Plan
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    $2.99
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Billed monthly · Cancel anytime
                </span>
              </button>
            </div>

            {/* Feature Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Included in Premium:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Custom categories</strong> with custom icons and color tags</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Multiple advance alerts</strong> per reminder (e.g. 15d, 5d, 1d)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>5 custom notification tones</strong> synthesized with Web Audio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Subscription &amp; trial cost tracking</strong> with renewal projections</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Completed reminders control:</strong> hide/show and bulk cleanup</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Full data export</strong> (JSON and CSV formats)</span>
                </li>
              </ul>
            </div>

            {/* Google Play Account Information */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GooglePlayIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Google Play Account
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Google Play Billing
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="google-account@gmail.com"
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                Subscription and receipts will be billed to your Google Play Store account.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Play Billing CTA Button */}
            <button
              type="button"
              onClick={handleStartGooglePlayBilling}
              disabled={isProcessing}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <GooglePlayIcon className="w-5 h-5 shrink-0" />
              <span>Subscribe with Google Play</span>
            </button>

            {/* Google Play Store Legal & Renewal Disclosures */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-normal">
              <p>
                {selectedPlanId === 'annual'
                  ? 'Includes a 7-day free trial. Starting on day 8, your Google Play account will be charged US$19.99/year. Cancel anytime in Google Play > Subscriptions before the trial ends to avoid charges.'
                  : 'Your Google Play account will be charged US$2.99/month on a recurring basis. Cancel anytime in Google Play > Subscriptions without losing saved reminders.'}
              </p>
              <p className="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Google Play In-App Purchase:</strong> Handled securely through Google Play Billing. Payment methods, family sharing, and cancellation are managed directly through Google Play.
                </span>
              </p>
            </div>
          </div>
        )}

        {checkoutStep === 'authorizing' && (
          <div className="py-10 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <GooglePlayIcon className="w-5 h-5" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Connecting to Google Play Billing...
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Verifying Google Play purchase token and activating your Premium entitlement for {userEmail}...
            </p>
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="text-center space-y-4 py-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <GooglePlayIcon className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Welcome to Vocalis Premium!
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your Google Play subscription has been verified. All Premium features and custom categories are now unlocked.
              </p>
            </div>

            {completedTransaction && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {completedTransaction.planId === 'annual' ? 'Annual (US$19.99/yr)' : 'Monthly (US$2.99/mo)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processor:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Google Play Billing
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Google Play Order ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                    {completedTransaction.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Dispatched To:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {completedTransaction.userEmail}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {dispatchedEmail && onViewEmail && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewEmail(dispatchedEmail);
                  }}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>View Google Play Order Confirmation Receipt</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white transition-colors cursor-pointer"
              >
                Start Using Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
