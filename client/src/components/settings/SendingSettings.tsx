import { AlertTriangle, Gauge, PauseCircle } from 'lucide-react';
import type { AppSettings } from '@/types/settings.type';
import { inputClass, SettingRow, SettingsCard, Switch } from './primitives';

type Props = {
  value: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
};

const COOLDOWNS = [
  { v: 30, l: '30 days' },
  { v: 60, l: '60 days' },
  { v: 90, l: '90 days' },
  { v: 180, l: '180 days' },
  { v: 365, l: '1 year' },
];

export function SendingSettings({ value, onChange }: Props) {
  const delayInvalid = value.minDelaySec > value.maxDelaySec;
  const windowInvalid = value.windowStart >= value.windowEnd;
  const aggressive = value.dailyLimit > 50;

  const num = (v: string, fallback: number) =>
    Number.isFinite(+v) && v !== '' ? Math.max(0, Math.round(+v)) : fallback;

  return (
    <SettingsCard
      icon={Gauge}
      title="Sending"
      description="Keep your pace human so your Gmail stays in good standing."
    >
      <SettingRow
        label="Pause sending"
        help="Stops the queue right away. Nothing is lost, and sending resumes when you turn this off."
      >
        <div className="flex items-center gap-3 sm:justify-end">
          {value.paused && (
            <PauseCircle className="size-4 text-muted-foreground" />
          )}
          <Switch
            label="Pause sending"
            checked={value.paused}
            onChange={(paused) => onChange({ paused })}
          />
        </div>
      </SettingRow>

      <SettingRow
        label="Daily limit"
        help="Emails sent per day. 30 to 50 is a safe range."
        htmlFor="daily-limit"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              id="daily-limit"
              type="range"
              min={5}
              max={100}
              step={5}
              value={value.dailyLimit}
              onChange={(e) => onChange({ dailyLimit: +e.target.value })}
              className="h-2 flex-1 cursor-pointer accent-primary"
            />
            <span className="w-8 text-right text-sm font-medium tabular-nums">
              {value.dailyLimit}
            </span>
          </div>
          {aggressive && (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Above 50 a day raises the chance Gmail flags your account.
            </p>
          )}
        </div>
      </SettingRow>

      <SettingRow
        wide
        label="Gap between emails"
        help="Each gap is picked at random between these two values."
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              aria-label="Minimum gap in seconds"
              aria-invalid={delayInvalid}
              type="number"
              min={10}
              value={value.minDelaySec}
              onChange={(e) =>
                onChange({
                  minDelaySec: num(e.target.value, value.minDelaySec),
                })
              }
              className={inputClass}
            />
            <span className="shrink-0 text-sm text-muted-foreground">to</span>
            <input
              aria-label="Maximum gap in seconds"
              aria-invalid={delayInvalid}
              type="number"
              min={10}
              value={value.maxDelaySec}
              onChange={(e) =>
                onChange({
                  maxDelaySec: num(e.target.value, value.maxDelaySec),
                })
              }
              className={inputClass}
            />
            <span className="shrink-0 text-sm text-muted-foreground">sec</span>
          </div>
          {delayInvalid && (
            <p className="text-xs text-destructive">
              The minimum can't be higher than the maximum.
            </p>
          )}
        </div>
      </SettingRow>

      <SettingRow
        wide
        label="Send window"
        help="Emails only go out between these times, in your local time."
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              aria-label="Window start"
              aria-invalid={windowInvalid}
              type="time"
              value={value.windowStart}
              onChange={(e) => onChange({ windowStart: e.target.value })}
              className={`${inputClass} px-2.5`}
            />
            <span className="shrink-0 text-sm text-muted-foreground">to</span>
            <input
              aria-label="Window end"
              aria-invalid={windowInvalid}
              type="time"
              value={value.windowEnd}
              onChange={(e) => onChange({ windowEnd: e.target.value })}
              className={`${inputClass} px-2.5`}
            />
          </div>
          {windowInvalid && (
            <p className="text-xs text-destructive">
              The end time must be after the start time.
            </p>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Repeat cool-down"
        help="How long before the same recruiter can be emailed again."
        htmlFor="cooldown"
      >
        <select
          id="cooldown"
          value={value.cooldownDays}
          onChange={(e) => onChange({ cooldownDays: +e.target.value })}
          className={inputClass}
        >
          {COOLDOWNS.map((c) => (
            <option key={c.v} value={c.v}>
              {c.l}
            </option>
          ))}
        </select>
      </SettingRow>
    </SettingsCard>
  );
}
