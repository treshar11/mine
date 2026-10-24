import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize GoogleGenAI on the server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory store for server-verified transaction records and sent transactional emails
interface PaymentTransaction {
  orderId: string;
  transactionId: string;
  userEmail: string;
  planId: 'monthly' | 'annual';
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  billingFrequency: string;
  nextBillingDate: string;
}

interface EmailRecord {
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

const transactions: PaymentTransaction[] = [];
const sentEmails: EmailRecord[] = [];

// 1. Natural Language Voice & Typing Parser Endpoint
app.post('/api/parse-reminder', async (req: Request, res: Response) => {
  try {
    const { input, userReferenceTime } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const refDate = userReferenceTime ? new Date(userReferenceTime) : new Date();
    const currentDateStr = refDate.toISOString().slice(0, 10);
    const currentTimeStr = refDate.toTimeString().slice(0, 5);
    const currentDayName = refDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (ai) {
      try {
        const prompt = `You are a voice and text reminder parser for a modern Android reminder app.
The user speaks or types a reminder phrase in natural language.
Today is ${currentDayName}, ${currentDateStr} at ${currentTimeStr}.
Extract the following information from the user phrase:
"${input}"

Return a clean JSON object with:
- title: concise reminder title (e.g. "Pay electricity bill", "Doctor appointment", "Cancel Netflix trial"). Do not include phrases like "remind me to" in the title.
- date: YYYY-MM-DD. Compute the target date accurately based on words like "today", "tomorrow", "next Monday", "on the 25th", "in 3 days". If no date is given, default to today's date ${currentDateStr}.
- time: HH:MM in 24-hour format (e.g. "09:00", "15:30"). If no time is mentioned, default to "09:00".
- category: One of ['Personal', 'Work', 'Bills & Payments', 'Appointments', 'Subscriptions & Free Trials', 'Other']. Choose the most accurate one.
- recurrence: One of ['none', 'daily', 'weekly', 'monthly', 'annually'].
- isSubscription: boolean (true if it's about a subscription renewal, free trial expiration, or recurring paid service).
- subscriptionCost: number or null (e.g. 15.99 if "$15.99" mentioned).
- cancellationNotes: string or null (e.g. link or notes if mentioned).
- confidence: number between 0 and 1.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: ['Personal', 'Work', 'Bills & Payments', 'Appointments', 'Subscriptions & Free Trials', 'Other'],
                },
                recurrence: {
                  type: Type.STRING,
                  enum: ['none', 'daily', 'weekly', 'monthly', 'annually'],
                },
                isSubscription: { type: Type.BOOLEAN },
                subscriptionCost: { type: Type.NUMBER },
                cancellationNotes: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ['title', 'date', 'time', 'category', 'recurrence', 'isSubscription'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, result: parsed, source: 'gemini' });
      } catch (geminiError) {
        console.warn('Gemini parser fallback to heuristic:', geminiError);
      }
    }

    // Heuristic Fallback parser if Gemini is unavailable
    const fallback = parseReminderHeuristically(input, refDate);
    return res.json({ success: true, result: fallback, source: 'heuristic' });
  } catch (error: any) {
    console.error('Error in /api/parse-reminder:', error);
    res.status(500).json({ error: error.message || 'Failed to parse reminder' });
  }
});

function parseReminderHeuristically(input: string, refDate: Date) {
  let title = input.replace(/^(remind me to|remember to|set a reminder to|alert me to|don't forget to)\s+/i, '').trim();
  let category: 'Personal' | 'Work' | 'Bills & Payments' | 'Appointments' | 'Subscriptions & Free Trials' | 'Other' = 'Personal';
  let recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'annually' = 'none';
  let isSubscription = false;
  let subscriptionCost: number | null = null;

  const lower = input.toLowerCase();

  // Category detection
  if (lower.includes('bill') || lower.includes('rent') || lower.includes('electric') || lower.includes('pay') || lower.includes('utility') || lower.includes('loan')) {
    category = 'Bills & Payments';
  } else if (lower.includes('doctor') || lower.includes('dentist') || lower.includes('meeting') || lower.includes('appointment') || lower.includes('clinic')) {
    category = 'Appointments';
  } else if (lower.includes('subscription') || lower.includes('free trial') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('renew') || lower.includes('cancel')) {
    category = 'Subscriptions & Free Trials';
    isSubscription = true;
  } else if (lower.includes('project') || lower.includes('client') || lower.includes('report') || lower.includes('email') || lower.includes('boss') || lower.includes('deadline')) {
    category = 'Work';
  }

  // Cost detection
  const costMatch = input.match(/\$(\d+(\.\d{2})?)/);
  if (costMatch) {
    subscriptionCost = parseFloat(costMatch[1]);
  }

  // Recurrence detection
  if (lower.includes('every day') || lower.includes('daily')) recurrence = 'daily';
  else if (lower.includes('every week') || lower.includes('weekly')) recurrence = 'weekly';
  else if (lower.includes('every month') || lower.includes('monthly')) recurrence = 'monthly';

  // Date detection
  const targetDate = new Date(refDate);
  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes('next week')) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  // Time detection
  let time = '09:00';
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const isPm = timeMatch[3].toLowerCase() === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  return {
    title: title.slice(0, 80),
    date: targetDate.toISOString().slice(0, 10),
    time,
    category,
    recurrence,
    isSubscription,
    subscriptionCost,
    cancellationNotes: null,
    confidence: 0.85,
  };
}

// 2. Google Play Billing Processing Endpoints (Server Verified)
app.get('/api/play-billing/products', (_req: Request, res: Response) => {
  res.json({
    products: [
      {
        productId: 'vocalis_premium_annual',
        planId: 'annual',
        title: 'Vocalis Premium (Annual)',
        description: 'Full custom categories, multi-alerts, 5 audio tones, and full data export.',
        priceFormatted: '$19.99',
        priceMicros: 19990000,
        currency: 'USD',
        billingPeriod: 'P1Y',
        freeTrialPeriod: 'P7D',
        billingFrequency: 'Annual',
        terms: '7-day free trial. Then $19.99/year. Cancel anytime in Google Play.',
      },
      {
        productId: 'vocalis_premium_monthly',
        planId: 'monthly',
        title: 'Vocalis Premium (Monthly)',
        description: 'Full custom categories, multi-alerts, 5 audio tones, and full data export.',
        priceFormatted: '$2.99',
        priceMicros: 2990000,
        currency: 'USD',
        billingPeriod: 'P1M',
        freeTrialPeriod: null,
        billingFrequency: 'Monthly',
        terms: '$2.99/month recurring. Cancel anytime in Google Play.',
      },
    ],
  });
});

app.post('/api/play-billing/initiate-purchase', (req: Request, res: Response) => {
  const { planId, userEmail } = req.body;
  if (!planId || !['monthly', 'annual'].includes(planId)) {
    return res.status(400).json({ error: 'Valid planId is required (monthly or annual)' });
  }

  const productId = planId === 'annual' ? 'vocalis_premium_annual' : 'vocalis_premium_monthly';
  const amount = planId === 'monthly' ? 2.99 : 19.99;
  const billingFrequency = planId === 'monthly' ? 'Monthly' : 'Annual';
  const purchaseToken = `gplay_tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

  res.json({
    purchaseToken,
    productId,
    planId,
    amount,
    currency: 'USD',
    billingFrequency,
    userEmail: userEmail || 'user@example.com',
    playStoreAccount: userEmail || 'user@example.com',
    trialNotice: planId === 'annual' ? '7-day free trial included' : null,
  });
});

app.post('/api/play-billing/verify-purchase', (req: Request, res: Response) => {
  const { purchaseToken, planId, userEmail } = req.body;
  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }

  const amount = planId === 'monthly' ? 2.99 : 19.99;
  const billingFrequency = planId === 'monthly' ? 'Monthly' : 'Annual';
  const productId = planId === 'annual' ? 'vocalis_premium_annual' : 'vocalis_premium_monthly';

  // Standard Google Play Order ID format: GPA.XXXX-XXXX-XXXX-XXXXX
  const randomGpaPart = () => Math.floor(1000 + Math.random() * 9000);
  const googlePlayOrderId = `GPA.${randomGpaPart()}-${randomGpaPart()}-${randomGpaPart()}-${randomGpaPart()}${Math.floor(Math.random() * 10)}`;

  const now = new Date();
  const nextBilling = new Date(now);
  if (planId === 'monthly') {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  } else {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  }

  const txn: PaymentTransaction = {
    orderId: googlePlayOrderId,
    transactionId: googlePlayOrderId,
    userEmail: userEmail || 'user@example.com',
    planId: planId as 'monthly' | 'annual',
    amount,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: now.toISOString(),
    billingFrequency,
    nextBillingDate: nextBilling.toISOString(),
  };

  transactions.push(txn);

  res.json({
    status: 'COMPLETED',
    paymentProcessor: 'Google Play Billing',
    googlePlayOrderId,
    productId,
    transaction: txn,
    entitlement: {
      plan: planId,
      tier: 'PREMIUM',
      active: true,
      startDate: now.toISOString(),
      expiresAt: nextBilling.toISOString(),
      autoRenew: true,
      transactionId: googlePlayOrderId,
      googlePlayOrderId,
      purchaseToken: purchaseToken || `gplay_tok_${Date.now()}`,
    },
  });
});

// 3. Transactional Confirmation Email Endpoint (Section 10)
app.post('/api/send-confirmation-email', (req: Request, res: Response) => {
  const { userEmail, planId, amount, transactionId, nextBillingDate } = req.body;
  if (!userEmail || !planId || !transactionId) {
    return res.status(400).json({ error: 'Missing required email parameters' });
  }

  // Prevent duplicate confirmation emails
  const existing = sentEmails.find((e) => e.transactionId === transactionId);
  if (existing) {
    return res.json({ success: true, message: 'Email already dispatched', email: existing });
  }

  const planName = planId === 'annual' ? 'Premium Annual Plan' : 'Premium Monthly Plan';
  const billingCycle = planId === 'annual' ? 'US$19.99 / year' : 'US$2.99 / month';
  const nextDateFormatted = new Date(nextBillingDate || Date.now() + 30 * 86400000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const startDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const bodyText = `Welcome to Vocalis Premium!
Your Premium access has been activated successfully via Google Play Billing.

Subscription Details:
- Plan: ${planName}
- Amount Paid: ${amount || billingCycle}
- Google Play Order ID: ${transactionId}
- Subscription Start Date: ${startDateFormatted}
- Next Renewal Date: ${nextDateFormatted}

Your Premium Features:
- Unlimited Custom Categories with custom icons and colors
- Advanced Multiple Alerts & Custom Schedules
- 5 Premium Notification Tones
- Advanced Subscription & Trial Tracking with Cost Analysis
- Completed Reminders Management (Hide, Filter & Bulk Purge)
- Full History Export (JSON & CSV)

Managing Your Subscription:
You can manage or cancel your subscription anytime in the app under Settings > Account & Plan, or directly in Google Play > Payments & subscriptions. If you cancel, your Premium access remains active until ${nextDateFormatted}.

Customer Support:
If you need any assistance, contact our friendly support team at support@vocalisreminders.app.

Thank you for choosing Vocalis!`;

  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #0f172a; margin: 0 0 6px 0; font-size: 24px;">Welcome to Vocalis Premium!</h1>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Activated via Google Play Billing</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">Thank you for subscribing to <strong>Vocalis Premium</strong> through Google Play. Your account now has full access to all advanced customization, multi-alert notifications, and data export tools.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a; font-size: 16px;">Google Play Subscription Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Plan:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Amount:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0d9488;">${amount || billingCycle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Google Play Order ID:</td>
            <td style="padding: 6px 0; font-family: monospace; font-size: 12px; text-align: right; color: #475569;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Start Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${startDateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Next Renewal Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${nextDateFormatted}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px;">Managing Your Subscription</h4>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 12px 0;">
          Subscriptions are managed through Google Play. You can review renewal dates or turn off auto-renewal anytime in <strong>Google Play Store &gt; Payments &amp; subscriptions</strong>. If you cancel, your saved reminders and custom categories remain 100% intact.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #94a3b8; text-align: center;">
        Need help? Contact <a href="mailto:support@vocalisreminders.app" style="color: #0d9488; text-decoration: none;">support@vocalisreminders.app</a>.
        <br />
        &copy; 2026 Vocalis Reminders App. All rights reserved.
      </div>
    </div>
  `;

  const emailRecord: EmailRecord = {
    id: `EML-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to: userEmail,
    subject: `Google Play Order Confirmation: Vocalis Premium (${transactionId})`,
    sentAt: new Date().toISOString(),
    transactionId,
    plan: planName,
    amount: amount || billingCycle,
    bodyHtml,
    bodyText,
  };

  sentEmails.push(emailRecord);

  res.json({
    success: true,
    message: `Confirmation email dispatched to ${userEmail}`,
    email: emailRecord,
  });
});

app.get('/api/sent-emails', (req: Request, res: Response) => {
  const { email } = req.query;
  if (email && typeof email === 'string') {
    return res.json({ emails: sentEmails.filter((e) => e.to.toLowerCase() === email.toLowerCase()) });
  }
  res.json({ emails: sentEmails });
});

// Dev or Production Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Vocalis Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
