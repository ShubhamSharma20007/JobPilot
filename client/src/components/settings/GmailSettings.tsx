import { CheckCircle2, Mail } from "lucide-react"
import { useAuth } from "@/redux/hooks/useAuth"
import { ConnectGmail } from "@/components/gmail/ConnectGmail"
import { SettingRow, SettingsCard } from "./primitives"

export function GmailSettings() {
  const { user } = useAuth()
  if (!user) return null
  const connected = !!user.gmail_connected
  const bounceOk = !!user.gmail_bounce_check

  return (
    <SettingsCard
      icon={Mail}
      title="Gmail connection"
      description="JobPilot sends your applications from your own Gmail account."
    >
      <SettingRow
        label={connected ? "Connected" : "Not connected"}
        help={
          connected
            ? `Emails are sent from ${user.email}. JobPilot can only send mail, not read your inbox.`
            : "Allow JobPilot to send email on your behalf. You can revoke this at any time."
        }
      >
        <div className="sm:flex sm:justify-end">
          {connected ? (
          bounceOk ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium"><CheckCircle2 className="size-4" /> Ready to send</span>
          ) : (
            <ConnectGmail label="Reconnect to detect bounces" />
          )
        ) : <ConnectGmail />}
        </div>
      </SettingRow>
    </SettingsCard>
  )
}