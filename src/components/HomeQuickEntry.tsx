import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Calendar, Clock, Tag, Repeat, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { Category, CategoryId, RecurrenceType, Reminder } from '../types/reminder';
import { parseNaturalLanguageReminder, ParsedReminderResult } from '../utils/nlpParser';

interface HomeQuickEntryProps {
  categories: Category[];
  isPremium: boolean;
  onSaveReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenUpgradeForCategory?: () => void;
}

export const HomeQuickEntry: React.FC<HomeQuickEntryProps> = ({
  categories,
  isPremium,
  onSaveReminder,
  onOpenUpgradeForCategory,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Interpreted Confirmation State
  const [interpretedData, setInterpretedData] = useState<ParsedReminderResult | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryId>('personal');
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>('none');
  const [editAdvanceAlert, setEditAdvanceAlert] = useState<number>(0);
  const [editSubscriptionCost, setEditSubscriptionCost] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const handleStartListening = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('Speech recognition is not supported in this browser. Please type your reminder.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. You can still type your reminder directly.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input error (${event.error}). Please type below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Speech recognition init failed:', e);
      setIsListening(false);
      setSpeechError('Microphone unavailable in this context. Please type your reminder.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleInterpretInput = async (textToParse?: string) => {
    const text = (textToParse || inputText).trim();
    if (!text) return;

    if (isListening) {
      handleStopListening();
    }

    setIsProcessing(true);
    setSpeechError(null);

    try {
      const parsed = await parseNaturalLanguageReminder(text, new Date());
      setInterpretedData(parsed);
      setEditTitle(parsed.title || text);
      setEditDate(parsed.date || new Date().toISOString().slice(0, 10));
      setEditTime(parsed.time || '09:00');
      setEditCategory(parsed.categoryId || 'personal');
      setEditRecurrence(parsed.recurrence || 'none');
      setEditAdvanceAlert(parsed.advanceMinutes || 0);
      setEditSubscriptionCost(parsed.subscriptionCost ? parsed.subscriptionCost.toString() : '');
      setEditNotes(parsed.cancellationNotes || '');
    } catch (err) {
      console.error('Failed to interpret reminder:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = () => {
    if (!editTitle.trim()) return;

    const isSub = editCategory === 'subscriptions' || !!editSubscriptionCost;
    const subCostNum = editSubscriptionCost ? parseFloat(editSubscriptionCost) : undefined;

    onSaveReminder({
      title: editTitle.trim(),
      notes: editNotes.trim() || undefined,
      date: editDate || new Date().toISOString().slice(0, 10),
      time: editTime || '09:00',
      categoryId: editCategory || null,
      isCompleted: false,
      recurrence: editRecurrence,
      advanceAlerts: [editAdvanceAlert],
      isSubscription: isSub,
      subscriptionMeta: isSub
        ? {
            cost: subCostNum,
            billingCycle: editRecurrence === 'annually' ? 'annual' : 'monthly',
            isTrial: editTitle.toLowerCase().includes('trial'),
            cancellationNotes: editNotes || undefined,
          }
        : undefined,
    });

    // Reset entry state
    setInputText('');
    setInterpretedData(null);
  };

  const handleCancelConfirmation = () => {
    setInterpretedData(null);
  };

  const samplePrompts = [
    'Remind me to pay the electricity bill on the 25th at 9 AM',
    'Dentist checkup next Tuesday at 3:30 PM',
    'Cancel Netflix free trial in 5 days at 4 PM $15.99/mo',
    'Call mom every Sunday at 6 PM',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-colors">
      {/* Primary Voice & Manual Entry Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="reminder-input" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Reminder Creator
          </label>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Voice or text
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Prominent Microphone Button */}
          <button
            type="button"
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-950/50'
                : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800'
            }`}
            title={isListening ? 'Stop listening' : 'Speak to create a reminder'}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
          >
            {isListening ? <MicOff className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Manual Text Input Directly on Home Screen */}
          <div className="relative flex-1">
            <input
              id="reminder-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInterpretInput();
                }
              }}
              placeholder="What do you want to remember? (e.g. Pay bill on 25th at 9 AM)"
              className="w-full h-12 pl-3.5 pr-20 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors"
            />

            {inputText.trim() && (
              <button
                type="button"
                onClick={() => handleInterpretInput()}
                disabled={isProcessing}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Add</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Listening Status & Audio Wave Feedback */}
        {isListening && (
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-2 bg-rose-500 rounded-full animate-bounce"></span>
            </div>
            <span className="font-medium">Listening... speak naturally. When done, tap microphone to confirm.</span>
          </div>
        )}

        {/* Speech Error / Fallback Notice */}
        {speechError && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Fast Voice Example Chips */}
        {!interpretedData && !inputText && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Try saying:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(prompt);
                    handleInterpretInput(prompt);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interpreted Reminder Confirmation Card (Section 3 Requirement) */}
      {interpretedData && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Confirm Reminder Details
              </h4>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Review or adjust before saving
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Title field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Reminder Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Reminder title"
              />
            </div>

            {/* Date field */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Time field */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Category (Optional)</span>
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as CategoryId)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isCustom ? '(Custom)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurrence selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
                <span>Repeat</span>
              </label>
              <select
                value={editRecurrence}
                onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {/* Advance Alert selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Advance Alert
              </label>
              <select
                value={editAdvanceAlert}
                onChange={(e) => setEditAdvanceAlert(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="0">At time of event</option>
                <option value="10">10 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            {/* Subscription cost if applicable */}
            {(editCategory === 'subscriptions' || editCategory === 'bills' || editSubscriptionCost) && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Amount / Cost (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editSubscriptionCost}
                  onChange={(e) => setEditSubscriptionCost(e.target.value)}
                  placeholder="e.g. 15.99"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelConfirmation}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Reminder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
