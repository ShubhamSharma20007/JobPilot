import { Bell } from "lucide-react"
import type { AppSettings } from "@/types/settings.type"
import { SettingRow, SettingsCard, Switch } from "./primitives"

type Props = { value: AppSettings; onChange: (patch: Partial<AppSettings>) => void }

export function NotificationSettings({ value, onChange }: Props) {
  return (
    <SettingsCard icon={Bell} title="Notifications" description="Get told about problems without checking your sheet.">
      <SettingRow label="Email me when a send fails" help="One short message per failure, with the reason.">
        <div className="sm:flex sm:justify-end">
          <Switch
            label="Email me when a send fails"
            checked={value.notifyOnFailure}
            onChange={(notifyOnFailure) => onChange({ notifyOnFailure })}
          />
        </div>
      </SettingRow>
      <SettingRow label="Daily summary" help="Sent once each evening with how many emails went out and how many failed.">
        <div className="sm:flex sm:justify-end">
          <Switch
            label="Daily summary"
            checked={value.notifyDailySummary}
            onChange={(notifyDailySummary) => onChange({ notifyDailySummary })}
          />
        </div>
      </SettingRow>
    </SettingsCard>
  )
}