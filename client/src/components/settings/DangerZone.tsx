import { useState } from "react"
import { Loader2, ShieldAlert, Trash2, Unplug } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { dispatchAuth } from "@/redux/hooks/dispatchAuth"
import { SettingRow, SettingsCard } from "./primitives"
import { useNavigate } from "react-router-dom"
import { userService } from "@/services/user.service"

type Kind = "revoke" | "delete"

// A rejected thunk throws the message string from rejectWithValue
const errorText = (e: unknown, fallback: string) => (typeof e === "string" ? e : fallback)

function ConfirmButton({
  label,
  confirmLabel,
  icon,
  busy,
  disabled,
  onConfirm,
}: {
  label: string
  confirmLabel: string
  icon: React.ReactNode
  busy?: boolean
  disabled?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming)
    return (
      <Button variant="destructive" disabled={disabled} onClick={() => setConfirming(true)}>
        {icon} {label}
      </Button>
    )

  return (
    <div className="flex items-center gap-2 sm:justify-end">
      <Button variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        disabled={busy}
        onClick={async () => {
          await onConfirm()
          setConfirming(false)
        }}
      >
        {busy && <Loader2 className="animate-spin" />}
        {busy ? "Working…" : confirmLabel}
      </Button>
    </div>
  )
}

export function DangerZone() {
  const { user } = useAuth()
  const { disconnectGmail } = dispatchAuth()
  const [busy, setBusy] = useState<Kind | null>(null)
  const connected = !!user?.gmail_connected
  const { logout } = useAuth()
  const navigate = useNavigate()
  async function disconnect() {
    setBusy("revoke")
    try {
      await disconnectGmail()
      toast.success("Google disconnected", { description: "Sending has stopped. Reconnect Gmail to start again." })
    } catch (e) {
      toast.error("Couldn't disconnect Google", { description: errorText(e, "Please try again.") })
    } finally {
      setBusy(null)
    }
  }

  async function deleteAll() {
  setBusy("delete")
  try {
    await userService.deleteAccount()
    await logout()            
    navigate("/", { replace: true })
    toast.success("Your account and data were deleted")
  } catch (e) {
    toast.error("Couldn't delete your data", { description: "Please try again." })
  } finally {
    setBusy(null)
  }
}

  return (
    <SettingsCard icon={ShieldAlert} title="Danger zone" description="These actions can't be undone.">
      <SettingRow
        label="Disconnect Google"
        help={
          connected
            ? "Revokes JobPilot's Gmail access and deletes the stored tokens. Sending stops until you connect Gmail again."
            : "Gmail isn't connected, so there is nothing to disconnect."
        }
      >
        <div className="sm:flex sm:justify-end">
          <ConfirmButton
            label="Disconnect Google"
            confirmLabel="Yes, disconnect"
            icon={<Unplug />}
            busy={busy === "revoke"}
            disabled={!connected}
            onConfirm={disconnect}
          />
        </div>
      </SettingRow>

      <SettingRow
        label="Delete my data"
        help="Removes your account, resumes, template and stored Google tokens."
      >
        <div className="sm:flex sm:justify-end">
          <ConfirmButton
            label="Delete my data"
            confirmLabel="Yes, delete everything"
            icon={<Trash2 />}
            busy={busy === 'delete'}
            onConfirm={deleteAll}
          />
        </div>
      </SettingRow>
    </SettingsCard>
  )
}