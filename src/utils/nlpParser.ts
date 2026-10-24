import { CategoryId, RecurrenceType } from '../types/reminder';

export interface ParsedReminderResult {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  categoryId: CategoryId;
  recurrence: RecurrenceType;
  advanceMinutes?: number;
  isSubscription?: boolean;
  subscriptionCost?: number | null;
  cancellationNotes?: string | null;
  confidence?: number;
  source?: 'gemini' | 'heuristic';
}

export async function parseNaturalLanguageReminder(
  input: string,
  userTime: Date = new Date()
): Promise<ParsedReminderResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    const todayStr = userTime.toISOString().slice(0, 10);
    return {
      title: '',
      date: todayStr,
      time: '09:00',
      categoryId: 'personal',
      recurrence: 'none',
      confidence: 1,
      source: 'heuristic',
    };
  }

  // Attempt server-side Gemini parse first
  try {
    const res = await fetch('/api/parse-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: trimmed,
        userReferenceTime: userTime.toISOString(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.result && data.result.title) {
        // Map category string to category ID
        const catMap: Record<string, CategoryId> = {
          'Personal': 'personal',
          'Work': 'work',
          'Bills & Payments': 'bills',
          'Appointments': 'appointments',
          'Subscriptions & Free Trials': 'subscriptions',
          'Other': 'other',
        };
        const catId = catMap[data.result.category] || 'personal';

        return {
          title: data.result.title,
          date: data.result.date,
          time: data.result.time || '09:00',
          categoryId: catId,
          recurrence: (data.result.recurrence || 'none') as RecurrenceType,
          isSubscription: !!data.result.isSubscription,
          subscriptionCost: data.result.subscriptionCost || null,
          cancellationNotes: data.result.cancellationNotes || null,
          confidence: data.result.confidence || 0.95,
          source: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('Server parse reminder failed, using client heuristic:', err);
  }

  // Fallback fast client heuristic
  return parseClientHeuristic(trimmed, userTime);
}

export function parseClientHeuristic(input: string, userTime: Date): ParsedReminderResult {
  const lower = input.toLowerCase();
  let title = input
    .replace(/^(remind me to|remember to|set a reminder to|alert me to|don't forget to|i need to|please remind me to)\s+/i, '')
    .trim();

  // Category identification
  let categoryId: CategoryId = 'personal';
  let isSubscription = false;
  if (/bill|rent|electric|water|gas|wifi|internet|loan|mortgage|pay|invoice/i.test(lower)) {
    categoryId = 'bills';
  } else if (/doctor|dentist|appointment|clinic|physio|therapist|meeting|checkup/i.test(lower)) {
    categoryId = 'appointments';
  } else if (/subscription|trial|netflix|spotify|disney|prime|hulu|apple|gym|renew|cancel/i.test(lower)) {
    categoryId = 'subscriptions';
    isSubscription = true;
  } else if (/project|client|deadline|report|presentation|boss|colleague|email|interview/i.test(lower)) {
    categoryId = 'work';
  }

  // Cost extraction
  let subscriptionCost: number | null = null;
  const costMatch = input.match(/\$(\d+(\.\d{2})?)/);
  if (costMatch) {
    subscriptionCost = parseFloat(costMatch[1]);
  }

  // Recurrence
  let recurrence: RecurrenceType = 'none';
  if (/every\s*day|daily/i.test(lower)) recurrence = 'daily';
  else if (/every\s*week|weekly/i.test(lower)) recurrence = 'weekly';
  else if (/every\s*month|monthly/i.test(lower)) recurrence = 'monthly';
  else if (/every\s*year|yearly|annually/i.test(lower)) recurrence = 'annually';

  // Date calculation
  const targetDate = new Date(userTime);
  const dayMatch = lower.match(/\b(on the (\d{1,2})(?:st|nd|rd|th)?|on (\d{1,2})(?:st|nd|rd|th)?)\b/);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[2] || dayMatch[3], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      if (dayNum < targetDate.getDate()) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      targetDate.setDate(dayNum);
    }
  } else if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(`next ${days[i]}`) || lower.includes(`this ${days[i]}`)) {
        const currentDay = targetDate.getDay();
        const diff = (i + 7 - currentDay) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }
  }

  // Time calculation
  let timeStr = '09:00';
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const isPm = timeMatch[3].toLowerCase() === 'pm';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } else if (lower.includes('in the morning')) {
    timeStr = '09:00';
  } else if (lower.includes('in the afternoon')) {
    timeStr = '14:00';
  } else if (lower.includes('in the evening') || lower.includes('tonight')) {
    timeStr = '19:00';
  }

  // Clean trailing date/time patterns from title
  title = title
    .replace(/\b(today|tomorrow|yesterday|next week|next month)\b/gi, '')
    .replace(/\b(at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi, '')
    .replace(/\b(on the \d{1,2}(?:st|nd|rd|th)?|on \d{1,2}(?:st|nd|rd|th)?)\b/gi, '')
    .replace(/\b(every (?:day|week|month|year))\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || input,
    date: targetDate.toISOString().slice(0, 10),
    time: timeStr,
    categoryId,
    recurrence,
    isSubscription,
    subscriptionCost,
    confidence: 0.82,
    source: 'heuristic',
  };
}

export function computeNextRecurrenceDate(currentDateStr: string, recurrence: RecurrenceType): string {
  const d = new Date(`${currentDateStr}T12:00:00`);
  switch (recurrence) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'annually':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return currentDateStr;
  }
  return d.toISOString().slice(0, 10);
}
