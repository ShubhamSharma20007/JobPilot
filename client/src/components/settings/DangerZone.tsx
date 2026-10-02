import { useState } from "react"
import { ShieldAlert, Trash2, Unplug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingRow, SettingsCard } from "./primitives"

export function DangerZone() {
  const [confirming, setConfirming] = useState<"revoke" | "delete" | null>(null)

  function Confirm({ kind, label }: { kind: "revoke" | "delete"; label: string }) {
    if (confirming !== kind)
      return (
        <Button variant="destructive" onClick={() => setConfirming(kind)}>
          {kind === "revoke" ? <Unplug /> : <Trash2 />} {label}
        </Button>
      )
    return (
      <div className="flex items-center gap-2 sm:justify-end">
        <Button variant="ghost" onClick={() => setConfirming(null)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            // TODO: call your backend
            console.log("confirmed:", kind)
            setConfirming(null)
          }}
        >
          Yes, {kind === "revoke" ? "disconnect" : "delete everything"}
        </Button>
      </div>
    )
  }

  return (
    <SettingsCard
      icon={ShieldAlert}
      title="Danger zone"
      description="These actions can't be undone."
    >
      <SettingRow label="Disconnect Google" help="Revokes Gmail and Sheets access. Sending stops until you sign in again.">
        <div className="sm:flex sm:justify-end">
          <Confirm kind="revoke" label="Disconnect Google" />
        </div>
      </SettingRow>
      <SettingRow label="Delete my data" help="Removes your account, resumes, template and stored Google tokens. Your Google Sheet stays in your Drive.">
        <div className="sm:flex sm:justify-end">
          <Confirm kind="delete" label="Delete my data" />
        </div>
      </SettingRow>
    </SettingsCard>
  )
}