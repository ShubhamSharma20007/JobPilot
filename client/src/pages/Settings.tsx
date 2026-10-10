import { useCallback, useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { Loader2, Save, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { settingsService } from "@/services/settings.service"
import type { AppSettings } from "@/types/settings.type"
import { SendingSettings } from "@/components/settings/SendingSettings"
import { TemplateSettings } from "@/components/settings/TemplateSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { DangerZone } from "@/components/settings/DangerZone"
import { GmailSettings } from "@/components/settings/GmailSettings"
import { AiSettings } from "@/components/settings/AiSettings"
import { gradientBtn } from "@/components/settings/primitives"
import Loader from "@/components/Loader"

function apiError(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const detail = e.response?.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) {
      return String(detail[0].msg).replace(/^Value error, /, "")
    }
  }
  return fallback
}

export default function Settings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<AppSettings | null>(null)
  const [draft, setDraft] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const data = await settingsService.get()
      setSaved(data)
      setDraft(data)
    } catch (e) {
      setLoadFailed(true)
      toast.error("Couldn't load your settings", { description: apiError(e, "Please try again.") })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!user) return null

  // Show a retry instead of the form if loading failed, so a user can't
  // accidentally save defaults over their real settings.
  if (loading) return <Loader />
  if (loadFailed || !saved || !draft) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-sm place-items-center gap-3 px-4 text-center">
        <div className="space-y-3">
          <p className="font-medium">We couldn't load your settings.</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      </div>
    )
  }

  const patch = (p: Partial<AppSettings>) => setDraft((d) => (d ? { ...d, ...p } : d))
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const invalid =
    draft.minDelaySec > draft.maxDelaySec ||
    draft.windowStart >= draft.windowEnd ||
    !draft.subject.trim() ||
    !draft.body.trim()

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const fresh = await settingsService.save(draft)
      setSaved(fresh) // use the server's version (e.g. trimmed subject/body)
      setDraft(fresh)
      toast.success("Settings saved")
    } catch (e) {
      toast.error("Couldn't save settings", { description: apiError(e, "Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative isolate overflow-hidden">
      {/* Soft glow behind the page heading, same colours as the landing hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72">
        <div className="absolute top-[-9rem] left-1/2 h-[18rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 pb-28">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Control how and when JobPilot sends your applications.</p>
        </div>
        <GmailSettings />
        <SendingSettings value={draft} onChange={patch} />
        <TemplateSettings value={draft} onChange={patch} email={user.email} name={user.name ?? user.email} />
        <AiSettings />
        <NotificationSettings value={draft} onChange={patch} />
        <DangerZone />

        {/* Unsaved changes bar */}
        <div
          aria-hidden={!dirty}
          className={`fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center justify-between gap-3 rounded-2xl border bg-card/95 px-4 py-3 shadow-lg shadow-indigo-500/10 backdrop-blur transition-all duration-300 ${
            dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          }`}
        >
          <p className="text-sm">{invalid ? "Fix the highlighted fields to save." : "You have unsaved changes."}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setDraft(saved)} disabled={saving} tabIndex={dirty ? 0 : -1}>
              <Undo2 /> Discard
            </Button>
            <Button className={gradientBtn} onClick={save} disabled={invalid || saving} tabIndex={dirty ? 0 : -1}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}