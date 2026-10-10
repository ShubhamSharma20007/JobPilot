export interface AppSettings {
  // Sending
  paused: boolean;
  dailyLimit: number;
  minDelaySec: number;
  maxDelaySec: number;
  windowStart: string; // "HH:MM"
  windowEnd: string; // "HH:MM"
  cooldownDays: number;
  // Template
  subject: string;
  body: string;
  // Notifications
  notifyOnFailure: boolean;
  notifyDailySummary: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  paused: false,
  dailyLimit: 40,
  minDelaySec: 30,
  maxDelaySec: 120,
  windowStart: '09:00',
  windowEnd: '18:00',
  cooldownDays: 90,
  subject: 'Application for {{role}} at {{company}}',
  body: `Hi {{recruiter_name}},

I came across the {{role}} opening at {{company}} and would love to be considered. My resume is attached.

I'd be glad to share more about my work whenever it suits you.

Thanks for your time,
{{name}}`,
  notifyOnFailure: true,
  notifyDailySummary: false,
};
