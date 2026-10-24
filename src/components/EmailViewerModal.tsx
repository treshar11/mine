import React from 'react';
import { X, Mail, CheckCircle, ShieldCheck } from 'lucide-react';
import { SentEmail } from '../types/reminder';

interface EmailViewerModalProps {
  email: SentEmail | null;
  onClose: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Google Play Order Confirmation Receipt (Section 10)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 space-y-1">
          <div><strong>To:</strong> {email.to}</div>
          <div><strong>Subject:</strong> {email.subject}</div>
          <div><strong>Dispatched:</strong> {new Date(email.sentAt).toLocaleString()}</div>
          <div><strong>Google Play Order ID:</strong> <span className="font-mono">{email.transactionId}</span></div>
        </div>

        {/* Email Preview Container */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-[420px] overflow-y-auto">
          <div
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            className="text-slate-800"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
