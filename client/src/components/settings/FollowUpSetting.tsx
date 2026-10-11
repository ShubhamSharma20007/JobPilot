import { MailPlus } from 'lucide-react';
import type { AppSettings } from '@/types/settings.type';
import { SettingRow, SettingsCard, Switch } from './primitives';

type Props = {
  value: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
};

const OPTIONS: AppSettings['followupDays'][] = [3, 5, 7];

export function FollowUpSettings({ value, onChange }: Props) {
  return (
    <SettingsCard
      icon={MailPlus}
      title="Auto follow-up"
      description="Send one polite reminder when a recruiter hasn't replied."
    >
      <SettingRow
        label="Follow up automatically"
        help="One follow-up per email, in the same Gmail thread. It uses your daily limit and send window, and never goes out if they already replied."
      >
        <div className="sm:flex sm:justify-end">
          <Switch
            label="Follow up automatically"
            checked={value.followupEnabled}
            onChange={(followupEnabled) => onChange({ followupEnabled })}
          />
        </div>
      </SettingRow>

      {value.followupEnabled && (
        <SettingRow
          wide
          label="Wait before following up"
          help="Days to wait after your first email."
        >
          <div
            role="radiogroup"
            aria-label="Days to wait before following up"
            className="flex flex-wrap gap-2 sm:justify-end"
          >
            {OPTIONS.map((d) => {
              const active = value.followupDays === d;
              return (
                <label
                  key={d}
                  className={`flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm transition has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${
                    active
                      ? 'border-indigo-500 bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-300'
                      : 'hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="followup-days"
                    value={d}
                    checked={active}
                    onChange={() => onChange({ followupDays: d })}
                    className="size-4 shrink-0 accent-indigo-500"
                  />
                  {d} days
                </label>
              );
            })}
          </div>
        </SettingRow>
      )}
    </SettingsCard>
  );
}