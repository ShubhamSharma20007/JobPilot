import { useState } from "react"
import { Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { DEFAULT_SETTINGS, type AppSettings } from "@/types/settings.type"
import { SendingSettings } from "@/components/settings/SendingSettings"
import { TemplateSettings } from "@/components/settings/TemplateSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { DangerZone } from "@/components/settings/DangerZone"

export default function Settings() {
  const { user } = useAuth()
  // TODO: load saved settings from your backend instead of defaults
  const [saved, setSaved] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS)

  if (!user) return null

  const patch = (p: Partial<AppSettings>) => setDraft((d) => ({ ...d, ...p }))
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const invalid = draft.minDelaySec > draft.maxDelaySec || draft.windowStart >= draft.windowEnd || !draft.subject.trim() || !draft.body.trim()

  function save() {
    // TODO: PUT draft to your backend
    setSaved(draft)
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 pb-28">
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control how and when JobPilot sends your applications.</p>
      </div>

      <SendingSettings value={draft} onChange={patch} />
      <TemplateSettings value={draft} onChange={patch} email={user.email} name={user.name ?? user.email} />
      <NotificationSettings value={draft} onChange={patch} />
      <DangerZone />

      {/* Unsaved changes bar */}
      <div
        aria-hidden={!dirty}
        className={`fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg transition-all duration-300 ${
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <p className="text-sm">{invalid ? "Fix the highlighted fields to save." : "You have unsaved changes."}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setDraft(saved)} tabIndex={dirty ? 0 : -1}>
            <Undo2 /> Discard
          </Button>
          <Button onClick={save} disabled={invalid} tabIndex={dirty ? 0 : -1}>
            <Save /> Save changes
          </Button>
        </div>
      </div>
    </section>
  )
}